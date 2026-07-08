import connectToDatabase from '@/lib/mongodb';
import { runScheduledEventEmailsAt9amPst } from '@/lib/scheduledEventEmailUtils';
import Event from '@/models/Event';
import Host from '@/models/Host';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Regression test for the "emails sent for events with 0 seats available" bug.
 *
 * Background: previously, if a host registered all available seats before the
 * scheduled announcement date, the daily cron at 9am Pacific would still blast
 * Tier 1 / Tier 2 / General announcements telling people to register for a full
 * event. The fix in lib/scheduledEventEmailUtils.ts skips announcements when
 * seatsAvailable === 0 and surfaces them in the run summary as "SKIPPED".
 *
 * This test creates two events under a fresh test host:
 *   1) Zero-seats event:  maxPlayers === registeredPlayers.length
 *   2) With-seats event:  maxPlayers > registeredPlayers.length
 * Both have announcementTier1At = now, so the cron picks them up. Expected:
 *   1) Zero-seats event yields a "SKIPPED: 0 seats available" detail with 0 emails.
 *   2) With-seats event yields a "Announcement (Tier 1)" detail with >= 1 email.
 *
 * sendEmail() is short-circuited via TEST_DRY_RUN=true so no real emails are sent.
 * The cron run is scoped to only the test event IDs via the new `eventIds` option,
 * so running this won't mark any production events as "sent".
 *
 * Run with:
 *   curl -X POST http://localhost:3000/api/test/zero-seats-email | jq
 *
 * The route refuses to run in production.
 */

const ADMIN_GUARD = process.env.NODE_ENV !== 'production';

function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function buildAlias(baseEmail: string, tag: string): string {
  // smriunge@gmail.com + 'host' -> smriunge+host_<suffix>@gmail.com
  const [local, domain] = baseEmail.split('@');
  return `${local}+${tag}_${uniqueSuffix()}@${domain}`;
}

function buildPhone(): string {
  // E.164-ish unique phone. The User schema requires phone to be unique.
  const n = Date.now().toString().slice(-10);
  return `+1${n}`;
}

export async function POST(_req: NextRequest) {
  if (!ADMIN_GUARD) {
    return NextResponse.json(
      { error: 'Test routes are disabled in production.' },
      { status: 403 }
    );
  }

  const baseEmail = process.env.TEST_EMAIL;
  if (!baseEmail) {
    return NextResponse.json(
      { error: 'TEST_EMAIL is not set in .env.local — cannot run test.' },
      { status: 500 }
    );
  }

  // Track every doc we create so we can clean up reliably even on assertion failure.
  const createdUserIds: string[] = [];
  const createdHostIds: string[] = [];
  const createdEventIds: string[] = [];

  // Save and force the dry-run flag so no real emails leave during the test.
  const previousDryRun = process.env.TEST_DRY_RUN;
  process.env.TEST_DRY_RUN = 'true';

  try {
    await connectToDatabase();

    const passwordHash = await bcrypt.hash('test-password-not-used', 4);

    // ───────────────────────────────────────────────────────────────────
    // Fixtures: 1 host user, 1 host doc, 1 tier1 user (recipient),
    // 2 "registered" users to fill the zero-seats event, 2 events.
    // ───────────────────────────────────────────────────────────────────
    const hostUser = await User.create({
      firstName: 'TestHost',
      lastName: 'Cron',
      email: buildAlias(baseEmail, 'host'),
      phoneNumber: buildPhone(),
      role: 'MEMBER',
      password: passwordHash,
      approvalStatus: 'APPROVED',
    });
    createdUserIds.push(hostUser._id.toString());

    const tier1User = await User.create({
      firstName: 'TestTier1',
      lastName: 'Recipient',
      email: buildAlias(baseEmail, 'tier1'),
      phoneNumber: buildPhone(),
      role: 'MEMBER',
      password: passwordHash,
      approvalStatus: 'APPROVED',
    });
    createdUserIds.push(tier1User._id.toString());

    const filler1 = await User.create({
      firstName: 'TestFiller1',
      lastName: 'Seat',
      email: buildAlias(baseEmail, 'fill1'),
      phoneNumber: buildPhone(),
      role: 'MEMBER',
      password: passwordHash,
      approvalStatus: 'APPROVED',
    });
    createdUserIds.push(filler1._id.toString());

    const filler2 = await User.create({
      firstName: 'TestFiller2',
      lastName: 'Seat',
      email: buildAlias(baseEmail, 'fill2'),
      phoneNumber: buildPhone(),
      role: 'MEMBER',
      password: passwordHash,
      approvalStatus: 'APPROVED',
    });
    createdUserIds.push(filler2._id.toString());

    const host = await Host.create({
      user: hostUser._id,
      address: '123 Test Lane',
      tier1: [tier1User._id],
      tier2: [],
    });
    createdHostIds.push(host._id.toString());

    const announceAt = new Date(); // now — falls in today's PST window

    const zeroSeatsEvent = await Event.create({
      title: 'TEST: Zero Seats Event',
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks out
      location: 'Test Location',
      host: host._id,
      maxPlayers: 2,
      eventType: 'NLHE',
      buyInMin: 1,
      buyInMax: 5,
      blinds: '10¢/25¢',
      announcementTier1At: announceAt,
      registeredPlayers: [filler1._id, filler2._id], // full
    });
    createdEventIds.push(zeroSeatsEvent._id.toString());

    const withSeatsEvent = await Event.create({
      title: 'TEST: With Seats Event',
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Test Location',
      host: host._id,
      maxPlayers: 8,
      eventType: 'NLHE',
      buyInMin: 1,
      buyInMax: 5,
      blinds: '10¢/25¢',
      announcementTier1At: announceAt,
      registeredPlayers: [filler1._id], // 7 seats free
    });
    createdEventIds.push(withSeatsEvent._id.toString());

    // ───────────────────────────────────────────────────────────────────
    // Run the cron, scoped to just our two events so we don't touch real data.
    // ───────────────────────────────────────────────────────────────────
    const result = await runScheduledEventEmailsAt9amPst({ eventIds: createdEventIds });

    const zeroSeatsDetail = result.details.find(d => d.eventTitle === 'TEST: Zero Seats Event');
    const withSeatsDetail = result.details.find(d => d.eventTitle === 'TEST: With Seats Event');

    // ───────────────────────────────────────────────────────────────────
    // Assertions
    // ───────────────────────────────────────────────────────────────────
    const tests = {
      zeroSeats_isSkipped: {
        expected: 'detail type contains "SKIPPED: 0 seats available"',
        actual: zeroSeatsDetail?.type ?? '(not found)',
        passed: !!zeroSeatsDetail && zeroSeatsDetail.type.includes('SKIPPED: 0 seats available'),
      },
      zeroSeats_zeroEmailsSent: {
        expected: 'emailsSent === 0',
        actual: zeroSeatsDetail?.emailsSent ?? null,
        passed: zeroSeatsDetail?.emailsSent === 0,
      },
      zeroSeats_flagNotBurned: {
        // The skip path should NOT mark announcementTier1Sent so a host who
        // raises maxPlayers later in the day can still send manually.
        expected: 'announcementTier1Sent remains false on zero-seats event',
        actual: undefined as unknown,
        passed: false,
      },
      withSeats_isAnnounced: {
        expected: 'detail type === "Announcement (Tier 1)"',
        actual: withSeatsDetail?.type ?? '(not found)',
        passed: withSeatsDetail?.type === 'Announcement (Tier 1)',
      },
      withSeats_atLeastOneEmail: {
        expected: 'emailsSent >= 1',
        actual: withSeatsDetail?.emailsSent ?? null,
        passed: (withSeatsDetail?.emailsSent ?? 0) >= 1,
      },
      withSeats_flagBurned: {
        expected: 'announcementTier1Sent === true on with-seats event',
        actual: undefined as unknown,
        passed: false,
      },
    };

    // Re-fetch events to verify the *Sent flags
    const [zeroSeatsAfter, withSeatsAfter] = await Promise.all([
      Event.findById(zeroSeatsEvent._id).lean(),
      Event.findById(withSeatsEvent._id).lean(),
    ]);
    tests.zeroSeats_flagNotBurned.actual = (zeroSeatsAfter as any)?.announcementTier1Sent ?? null;
    tests.zeroSeats_flagNotBurned.passed = (zeroSeatsAfter as any)?.announcementTier1Sent !== true;
    tests.withSeats_flagBurned.actual = (withSeatsAfter as any)?.announcementTier1Sent ?? null;
    tests.withSeats_flagBurned.passed = (withSeatsAfter as any)?.announcementTier1Sent === true;

    const allPassed = Object.values(tests).every(t => t.passed);

    return NextResponse.json({
      success: allPassed,
      summary: allPassed
        ? 'PASS — zero-seat events are correctly skipped, with-seat events still announce.'
        : 'FAIL — see assertions below.',
      cronResult: result,
      tests,
    }, { status: allPassed ? 200 : 500 });

  } catch (error: any) {
    console.error('Zero-seats email test failed:', error);
    return NextResponse.json(
      { error: 'Test runner threw an exception', message: error?.message, stack: error?.stack },
      { status: 500 }
    );
  } finally {
    // ───────────────────────────────────────────────────────────────────
    // Cleanup — always, even on assertion failure or exception.
    // ───────────────────────────────────────────────────────────────────
    try {
      if (createdEventIds.length) await Event.deleteMany({ _id: { $in: createdEventIds } });
      if (createdHostIds.length) await Host.deleteMany({ _id: { $in: createdHostIds } });
      if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
    } catch (cleanupErr) {
      console.error('Zero-seats test cleanup failed:', cleanupErr);
    }

    // Restore previous dry-run state.
    if (previousDryRun === undefined) {
      delete process.env.TEST_DRY_RUN;
    } else {
      process.env.TEST_DRY_RUN = previousDryRun;
    }
  }
}
