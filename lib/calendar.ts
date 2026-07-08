import { createEvent } from 'ics';

/**
 * Generates an ICS calendar file string for a poker event.
 *
 * @param title       Event title
 * @param description Optional description / details
 * @param location    Venue address or location string
 * @param startDate   Event start time (UTC Date object as stored in MongoDB)
 * @param durationHours  How long the game runs — defaults to 4 hours
 * @returns           Raw ICS file content as a string
 */
export function createIcsFile(event: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  durationHours?: number;
}): string {
  const { title, description, location, startDate, durationHours = 4 } = event;

  const start: [number, number, number, number, number] = [
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 1,
    startDate.getUTCDate(),
    startDate.getUTCHours(),
    startDate.getUTCMinutes(),
  ];

  const { error, value } = createEvent({
    title,
    description: description || 'Poker game — Ace Magnets Poker Club',
    location: location || '',
    start,
    startInputType: 'utc',
    duration: { hours: durationHours },
    url: 'https://acemagnetspoker.com',
    organizer: { name: 'Ace Magnets Poker Club', email: 'acemagnetspokerclub@gmail.com' },
  });

  if (error || !value) {
    throw new Error(`Failed to generate ICS file: ${error?.message ?? 'unknown error'}`);
  }

  return value;
}
