import fs from 'fs';
import path from 'path';
import { IUser } from '@/models/User';
import * as brevo from '@getbrevo/brevo';
import nodemailer from 'nodemailer';

// APP_URL is server-only and always points to production.
// NEXT_PUBLIC_APP_URL can be localhost in dev — never use it for emails.
const SITE_URL = process.env.APP_URL || 'https://tournament-of-champions.vercel.app';
import { Resend } from 'resend';
import { formatDateInPST, formatTimeInPST } from './utils';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export interface EmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface HostData {
  user: IUser;
  address: string;
}

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';
const FROM_EMAIL = process.env.FROM_EMAIL || 'timothyH@gmail.com';
const BCC_EMAIL = process.env.BCC_EMAIL || 'tournamentofchampionspokerseries@gmail.com';

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const brevoApiInstance = new brevo.TransactionalEmailsApi();

brevoApiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
);

function formatPhone(phone: string): string {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

function loadTemplate(filename: string, vars: Record<string, string>): string {
  const filePath = path.join(process.cwd(), 'lib', 'email-templates', filename);
  let html = fs.readFileSync(filePath, 'utf-8');

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

  if (bodyMatch) {
    html = bodyMatch[1].trim();
  }

  for (const [key, value] of Object.entries(vars)) {
    html = html.split(`{{${key}}}`).join(value);
  }

  return html;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  if (process.env.TEST_DRY_RUN === 'true') {
    console.log(`[TEST_DRY_RUN] sendEmail to=${emailData.to} subject="${emailData.subject}"`);
    return true;
  }

  try {
    const bccList = emailData.bcc
      ? [BCC_EMAIL, emailData.bcc].filter(Boolean)
      : [BCC_EMAIL];

    if (EMAIL_PROVIDER === 'gmail') {
      const mailOptions = {
        from: FROM_EMAIL,
        to: emailData.to,
        cc: emailData.cc,
        bcc: bccList,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      await gmailTransporter.sendMail(mailOptions);
      console.log(`Email sent via Gmail to: ${emailData.to}`);
      return true;
    }

    if (EMAIL_PROVIDER === 'brevo') {
      try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        const fromEmail = process.env.FROM_EMAIL || 'noreply@tournamentofchampionspokerseries.com';
        const fromName = 'Tournament of Champions — Poker Series';

        sendSmtpEmail.sender = { email: fromEmail, name: fromName };
        sendSmtpEmail.to = [{ email: emailData.to }];

        if (emailData.cc) {
          sendSmtpEmail.cc = [{ email: emailData.cc }];
        }

        sendSmtpEmail.bcc = bccList.map((email) => ({ email }));
        sendSmtpEmail.subject = emailData.subject;
        sendSmtpEmail.htmlContent = emailData.html;
        sendSmtpEmail.textContent = emailData.text;

        await brevoApiInstance.sendTransacEmail(sendSmtpEmail);

        console.log('Email sent via Brevo:', {
          to: emailData.to,
        });

        return true;
      } catch (brevoError: any) {
        console.error('Brevo Error Details:', {
          message: brevoError.message,
          code: brevoError.code,
          statusCode: brevoError.response?.status,
          statusText: brevoError.response?.statusText,
          errorData: brevoError.response?.data,
          isAxiosError: brevoError.isAxiosError,
          url: brevoError.config?.url,
        });

        return false;
      }
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('Missing RESEND_API_KEY');
      return false;
    }

    const resend = new Resend(apiKey);
    const bccString = bccList.join(',');

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.to,
      cc: emailData.cc,
      bcc: bccString,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (error) {
      console.error('Email sending error:', error);
      return false;
    }

    console.log(`Email sent via Resend to: ${emailData.to}`);
    return true;
  } catch (error) {
    console.error('Email sending exception:', error);
    return false;
  }
}

export function getSignupConfirmationEmail(
  firstName: string,
  email: string
): EmailData {
  return {
    to: email,
    subject: 'Welcome to Tournament of Champions — Poker Series',
    html: loadTemplate('01-signup-confirmation.html', {
      firstName,
    }),
    text: `Hi ${firstName},\n\nThank you for joining our private poker club! We're excited to have you as part of our community.\n\nYou can now view upcoming events, register for tournaments and cash games.\n\nWe look forward to seeing you at the tables!\n\nSee you at the felt,\nTim Hufler\n(360) 869-2538\nTournament of Champions — Poker Series (https://tournament-of-champions.vercel.app)`,
  };
}

export function getEventRegistrationEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = '',
  eventId: string = ''
): EmailData {
  const formattedDate = formatDateInPST(eventDateTime, {
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const baseUrl = SITE_URL;
  const eventUrl = eventId ? `${baseUrl}/events/${eventId}` : baseUrl;
  const calendarUrl = eventId ? `${baseUrl}/api/events/${eventId}/ics` : '';

  return {
    to: email,
    subject: `Your Seat Is Confirmed - ${formattedDate} Game`,
    html: loadTemplate('02-event-registration-confirmation.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      eventUrl,
      calendarUrl,
    }),
    text: `Hi ${firstName},\n\nYou are all set. Your registration for the upcoming game is confirmed!\n\nDate: ${formattedDateFull}\nTime: ${formattedTime}\n\nAdd to calendar: ${calendarUrl}\n\nIf your plans change, please visit the Tournament of Champions Poker website (https://tournament-of-champions.vercel.app) to un-register so we can offer the seat to another player.\n\nUntil the next shuffle,\nTim Hufler\n(360) 869-2538`,
  };
}

export function getEventNewSetForWailistPlayerEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = '',
  eventId: string = ''
): EmailData {
  const formattedDate = formatDateInPST(eventDateTime, {
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const baseUrl = SITE_URL;
  const eventUrl = eventId ? `${baseUrl}/events/${eventId}` : baseUrl;

  return {
    to: email,
    subject: `Your Seat Is Confirmed - ${formattedDate} Game`,
    html: loadTemplate('03-waitlist-seat-available.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      eventUrl,
    }),
    text: `Hi ${firstName},\n\nGood news — a seat has opened up and you've been moved from the waitlist into the game!\n\nEvent: ${eventTitle}\nDate: ${formattedDateFull}\nTime: ${formattedTime}\n\nIf your plans change, please visit the Tournament of Champions Poker website (https://tournament-of-champions.vercel.app) to un-register so we can offer the seat to another player.\n\nUntil the next shuffle,\nTim Hufler\n(360) 869-2538`,
  };
}

export function getEventReminderEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = '',
  eventId: string = ''
): EmailData {
  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const baseUrl = SITE_URL;
  const eventUrl = eventId ? `${baseUrl}/events/${eventId}` : baseUrl;

  return {
    to: email,
    subject: `Reminder: ${eventTitle}`,
    html: loadTemplate('04-event-reminder.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostAddress: eventHost.address,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      eventUrl,
    }),
    text: `Hi ${firstName},\n\nThis is a friendly reminder that you're registered for tomorrow's event:\n\n${eventTitle}\n- Date: ${formattedDateFull}\n- Time: ${formattedTime}\n\nDon't forget to bring your A-game!\n\nTournament of Champions — Poker Series (https://tournament-of-champions.vercel.app)`,
  };
}

export function getPasswordResetEmail(
  firstName: string,
  email: string,
  resetUrl: string
): EmailData {
  return {
    to: email,
    subject: 'Password Reset Request',
    html: loadTemplate('05-password-reset.html', {
      firstName,
      resetUrl,
    }),
    text: `Hi ${firstName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this password reset, please ignore this email. Your password will remain unchanged.\n\nSee you at the felt,\nTim Hufler\n(360) 869-2538\nTournament of Champions — Poker Series (https://tournament-of-champions.vercel.app)`,
  };
}

export function getJoinRequestEmail(
  firstName: string,
  email: string
): EmailData {
  return {
    to: email,
    cc: process.env.ADMIN_EMAIL || 'admin@tournamentofchampionspokerseries.com',
    subject: 'Your Tournament of Champions — Poker Series Membership Request',
    html: loadTemplate('06-join-request.html', {
      firstName,
    }),
    text: `Hi ${firstName},\n\nThank you for your interest in joining Tournament of Champions — Poker Series.\n\nWe have received your membership request and it is now under review. We will follow up within 24 hours.\n\nSee you at the felt,\nTournament of Champions — Poker Series`,
  };
}

export function getApprovalEmail(
  firstName: string,
  email: string
): EmailData {
  return {
    to: email,
    subject: "Welcome to Tournament of Champions — Poker Series - You're Approved!",
    html: loadTemplate('07-membership-approved.html', {
      firstName,
    }),
    text: `Hi ${firstName},\n\nWelcome to Tournament of Champions — Poker Series!\n\nTournament of Champions — Poker Series\nMembership Approval\n\nGreat news! Your request to join our private poker club has been approved.\n\nYou can now:\n\nView upcoming events\nRegister for tournaments and cash games\nConnect with other players\n\nWe look forward to seeing you at the tables!\n\nSee you at the felt,\nTournament of Champions — Poker Series (https://tournament-of-champions.vercel.app/)`,
  };
}

export function getDenialEmail(
  firstName: string,
  email: string
): EmailData {
  return {
    to: email,
    subject: 'Poker Club Membership Update',
    html: loadTemplate('08-membership-denied.html', {
      firstName,
    }),
    text: `Hi ${firstName},\n\nThank you for your interest in joining our private poker club.\n\nAfter careful consideration, we regret to inform you that we are unable to approve your membership request at this time.\n\nWe appreciate your understanding and wish you the best in your poker endeavors.\n\nSee you at the felt,\nTim Hufler\n(360) 869-2538\nTournament of Champions — Poker Series (https://tournament-of-champions.vercel.app)`,
  };
}

export function getEventRegistrationNotificationEmail(
  memberFirstName: string,
  memberLastName: string,
  memberEmail: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData
): EmailData {
  const formattedDate = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    to: BCC_EMAIL,
    subject: `Member Registered: ${memberFirstName} ${memberLastName} - ${eventTitle}`,
    html: loadTemplate('09-admin-registration-notification.html', {
      memberFirstName,
      memberLastName,
      memberEmail,
      eventTitle,
      formattedDate,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
    }),
    text: `Member Registered for Event\n\nA member has registered for an upcoming event.\n\nMember Information:\nName: ${memberFirstName} ${memberLastName}\nEmail: ${memberEmail}\n\nEvent Details:\nEvent: ${eventTitle}\nDate: ${formattedDate}\nTime: ${formattedTime}\n\nThis is an automated notification. The member has been successfully registered for the event.`,
  };
}

export function getEventUnregistrationNotificationEmail(
  memberFirstName: string,
  memberLastName: string,
  memberEmail: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData
): EmailData {
  const formattedDate = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    to: BCC_EMAIL,
    subject: `Member Unregistered: ${memberFirstName} ${memberLastName} - ${eventTitle}`,
    html: loadTemplate('10-admin-unregistration-notification.html', {
      memberFirstName,
      memberLastName,
      memberEmail,
      eventTitle,
      formattedDate,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
    }),
    text: `Member Unregistered from Event\n\nA member has unregistered from an upcoming event.\n\nMember Information:\nName: ${memberFirstName} ${memberLastName}\nEmail: ${memberEmail}\n\nEvent Details:\nEvent: ${eventTitle}\nDate: ${formattedDate}\nTime: ${formattedTime}\n\nThis is an automated notification. The member has been removed from the event registration.`,
  };
}

export function getEventUnregistrationConfirmationEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventHost: HostData,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = ''
): EmailData {
  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    to: email,
    subject: `Unregistration Confirmed - ${eventTitle}`,
    html: loadTemplate('11-event-unregistration-confirmation.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
    }),
    text: `Hi ${firstName},\n\nYour unregistration from the following event has been confirmed:\n\nEvent: ${eventTitle}\nDate: ${formattedDateFull}\nTime: ${formattedTime}\n\nYour seat has been released and may be offered to another player. We hope to see you at future events!\n\nUntil the next shuffle,\nTim Hufler\n(360) 869-2538`,
  };
}

export function getEventAnnouncementEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  buyInMin: number,
  buyInMax: number,
  eventId: string,
  eventHost: HostData,
  blinds: string = '',
  eventDetails: string = '',
  seatsAvailable: number = 0,
  maxPlayers: number = 0
): EmailData {
  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const buyInRange = buyInMin === buyInMax
    ? `$${buyInMin}`
    : `$${buyInMin} - $${buyInMax}`;

  const baseUrl = SITE_URL;
  const eventUrl = `${baseUrl}/events/${eventId}`;

  return {
    to: email,
    subject: `New Event - ${eventTitle}`,
    html: loadTemplate('12-event-announcement.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName: eventHost.user.firstName + ' ' + eventHost.user.lastName,
      hostPhone: formatPhone(eventHost.user.phoneNumber),
      eventLocation,
      buyInRange,
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      eventUrl,
      baseUrl,
      seatsAvailable: String(seatsAvailable),
      maxPlayers: String(maxPlayers),
    }),
    text: `Hi ${firstName},\n\nWe're excited to announce a new poker event:\n\n${eventTitle}\n- Date: ${formattedDateFull}\n- Time: ${formattedTime}\n- Location: ${eventLocation}\n- Buy-in: ${buyInRange}\n\nREGISTER NOW: ${eventUrl}\n\nDon't miss out on this exciting event!\n\nTournament of Champions — Poker Series (${baseUrl})`,
  };
}

export function getEarlyAccessRegistrationConfirmationEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = '',
  announcementPostAt?: Date
): EmailData {
  const formattedDate = formatDateInPST(eventDateTime, {
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const announcementPostDate = announcementPostAt
    ? formatDateInPST(announcementPostAt, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'the announcement date';

  return {
    to: email,
    subject: `You're Registered - ${formattedDate} Game`,
    html: loadTemplate('14-early-access-registration-confirmation.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      announcementPostDate,
    }),
    text: `Hi ${firstName},\n\nYou're registered! Your seat is confirmed for the upcoming game. Full game details will appear in your My Events tab after ${announcementPostDate}.\n\nIf your plans change, please visit the Tournament of Champions Poker website (https://tournament-of-champions.vercel.app) to un-register so we can offer the seat to another player.\n\nUntil the next shuffle,\nTim Hufler\n(360) 869-2538`,
  };
}

export function getEventInvitationEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  eventId: string,
  userId: string,
  eventHost: HostData,
  buyInMin: number = 0,
  buyInMax: number = 0,
  blinds: string = '',
  eventDetails: string = ''
): EmailData {
  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const token = Buffer.from(
    JSON.stringify({
      userId,
      eventId,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');

  const baseUrl = process.env.NEXTAUTH_URL || 'https://tournament-of-champions.vercel.app';
  const acceptUrl = `${baseUrl}/events/${eventId}/invitation/accept?token=${token}`;
  const declineUrl = `${baseUrl}/events/${eventId}/invitation/decline?token=${token}`;

  const hostName = eventHost?.user
    ? `${eventHost.user.firstName} ${eventHost.user.lastName}`
    : '';

  const formattedDateShort = formatDateInPST(eventDateTime, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    to: email,
    subject: `Advance Notice for the Game on ${formattedDateShort}`,
    html: loadTemplate('13-event-invitation.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      hostName,
      buyInMin: `$${buyInMin}`,
      buyInMax: `$${buyInMax}`,
      blinds: blinds || 'TBD',
      eventDetails: eventDetails || '-',
      acceptUrl,
      declineUrl,
    }),
    text: `Hi ${firstName},\n\nYou're invited to an event for our club, and your seat at the table is being held.\n\nEvent Details\nDate: ${formattedDateFull}\nTime: ${formattedTime}\nLocation: ${eventLocation}\n\nPlease respond:\nAccept: ${acceptUrl}\nDecline: ${declineUrl}\n\nHope to see you at the table,\n\nTim Hufler\nTournament of Champions — Poker Series`,
  };
}

export function getOpenSeatEmail(
  firstName: string,
  email: string,
  eventTitle: string,
  eventDateTime: Date,
  eventLocation: string,
  buyInMin: number,
  buyInMax: number,
  eventId: string,
  seatsAvailable: number,
  maxPlayers: number
): EmailData {
  const formattedDateFull = formatDateInPST(eventDateTime, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeInPST(eventDateTime, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const buyInRange = buyInMin === buyInMax
    ? `$${buyInMin}`
    : `$${buyInMin} - $${buyInMax}`;

  const baseUrl = SITE_URL;
  const eventUrl = `${baseUrl}/events/${eventId}`;

  return {
    to: email,
    subject: `Seat Available: ${eventTitle}`,
    html: loadTemplate('15-open-seat-notification.html', {
      firstName,
      eventTitle,
      formattedDateFull,
      formattedTime,
      eventLocation,
      buyInRange,
      seatsAvailable: String(seatsAvailable),
      maxPlayers: String(maxPlayers),
      eventUrl,
      baseUrl,
    }),
    text: `Hi ${firstName},\n\nA seat has just opened up for ${eventTitle}.\n\nDate: ${formattedDateFull}\nTime: ${formattedTime}\nLocation: ${eventLocation}\nBuy-in: ${buyInRange}\nSeats Available: ${seatsAvailable} of ${maxPlayers}\n\nRegister now: ${eventUrl}\n\nFirst come, first served. Grab your spot while it lasts.\n\nUntil the next shuffle,\nTim Hufler\n(360) 869-2538`,
  };
}

// ── Admin cron-miss alert ─────────────────────────────────────────────────────

export interface CronMissDetail {
  eventTitle: string;
  missedTypes: string[];   // e.g. ["Tier 1 Announcement", "Reminder"]
}

/**
 * Sends an alert email to every ADMIN user informing them that the scheduled
 * cron did not run (or ran but missed some emails) and that they should trigger
 * a manual run from the admin panel.
 */
export async function sendAdminCronAlertEmail(
  missedDetails: CronMissDetail[],
  triggeredBy: 'watchdog' | 'manual' = 'watchdog',
): Promise<void> {
  await connectToDatabase();

  const admins = await User.find({ role: 'ADMIN' }).select('firstName email').lean();
  if (!admins.length) return;

  const baseUrl = SITE_URL;
  const adminUrl = `${baseUrl}/admin`;

  const missedRows = missedDetails
    .map(
      (d) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111">${d.eventTitle}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#555">${d.missedTypes.join(', ')}</td>
        </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:32px 16px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#cc2616;padding:20px 28px">
      <p style="margin:0;font-size:18px;font-weight:700;color:#fff">⚠️ Cron Alert — Missed Emails</p>
      <p style="margin:4px 0 0;font-size:13px;color:#fecaca">Tournament of Champions — Poker Series</p>
    </div>
    <div style="padding:24px 28px">
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        The daily email cron <strong>did not run</strong> (or skipped some emails) today.
        The following scheduled emails were <strong>not sent</strong>:
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Event</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Missed Email Types</th>
          </tr>
        </thead>
        <tbody>${missedRows}</tbody>
      </table>
      <p style="margin:0 0 20px;font-size:13px;color:#6b7280">
        This alert was triggered by the <strong>${triggeredBy}</strong> check.
        The watchdog has already attempted to re-run the cron — check the admin
        panel to confirm emails were sent.
      </p>
      <a href="${adminUrl}" style="display:inline-block;background:#14532d;color:#fff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:6px">
        Open Admin Panel →
      </a>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f3f4f6;background:#f9fafb">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        You received this because your account has Admin access on Tournament of Champions — Poker Series.
      </p>
    </div>
  </div>
</body>
</html>`;

  const missedText = missedDetails
    .map((d) => `• ${d.eventTitle}: ${d.missedTypes.join(', ')}`)
    .join('\n');

  for (const admin of admins) {
    const adminDoc = admin as { firstName?: string; email?: string };
    if (!adminDoc.email) continue;
    await sendEmail({
      to: adminDoc.email,
      subject: '⚠️ Tournament of Champions — Cron missed emails today',
      html,
      text: `The daily email cron did not run (or skipped some emails) today.\n\nMissed:\n${missedText}\n\nPlease log in to the admin panel and run the cron manually:\n${adminUrl}`,
    });
  }
}