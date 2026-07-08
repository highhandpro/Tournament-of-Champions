/**
 * Unit tests for lib/calendar.ts
 * Run with: npm test
 */

import { createIcsFile } from '../calendar';

const GAME_DATE = new Date('2025-06-14T01:00:00.000Z'); // 14 Jun 2025 18:00 PT

describe('createIcsFile', () => {
  it('returns a non-empty string', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a valid ICS envelope', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
    expect(result).toContain('BEGIN:VEVENT');
    expect(result).toContain('END:VEVENT');
  });

  it('includes the event title in the SUMMARY field', () => {
    const result = createIcsFile({
      title: 'Mixed Games Night',
      startDate: GAME_DATE,
    });

    expect(result).toContain('SUMMARY:Mixed Games Night');
  });

  it('includes the location when provided', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      location: '123 Poker Lane',
      startDate: GAME_DATE,
    });

    expect(result).toContain('LOCATION:123 Poker Lane');
  });

  it('omits LOCATION line when location is not provided', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    // ics omits the field entirely when value is empty string
    expect(result).not.toMatch(/^LOCATION:.+/m);
  });

  it('defaults to a 4-hour duration', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    // ics encodes duration as DURATION:PT4H
    expect(result).toContain('DURATION:PT4H');
  });

  it('respects a custom durationHours', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
      durationHours: 6,
    });

    expect(result).toContain('DURATION:PT6H');
  });

  it('encodes the start time in UTC', () => {
    // GAME_DATE is 2025-06-14T01:00:00Z → DTSTART:20250614T010000Z
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    expect(result).toContain('DTSTART:20250614T010000Z');
  });

  it('includes the Ace Magnets organiser', () => {
    const result = createIcsFile({
      title: 'NLHE 10¢/25¢',
      startDate: GAME_DATE,
    });

    expect(result).toContain('acemagnetspokerclub@gmail.com');
  });

  it('throws when given an invalid date', () => {
    expect(() =>
      createIcsFile({
        title: 'Bad Event',
        startDate: new Date('not-a-date'),
      })
    ).toThrow();
  });
});
