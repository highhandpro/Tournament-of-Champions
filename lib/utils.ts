import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date/time to PST timezone
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted time string in PST
 */
export function formatTimeInPST(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: 'America/Los_Angeles', // PST/PDT timezone
  }).format(dateObj);
}

/**
 * Formats a date to PST timezone
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in PST
 */
export function formatDateInPST(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: 'America/Los_Angeles', // PST/PDT timezone
  }).format(dateObj);
}

/**
 * Converts a date and time string (assumed to be in PST) to UTC ISO string
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format
 * @returns ISO string in UTC
 */
export function convertPSTToUTC(dateString: string, timeString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Use a binary search approach: try different UTC times until we find one
  // that formats to the desired PST time
  const pstFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  // Start with a reasonable guess: PST is typically UTC-8 or UTC-7
  // Try UTC-8 first (PST standard time)
  let candidateUTC = new Date(Date.UTC(year, month - 1, day, hours + 8, minutes, 0));
  
  // Check if this gives us the right PST time
  let parts = pstFormatter.formatToParts(candidateUTC);
  let pstHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  let pstMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  
  // If not correct, try UTC-7 (PDT daylight saving time)
  if (pstHour !== hours || pstMinute !== minutes) {
    candidateUTC = new Date(Date.UTC(year, month - 1, day, hours + 7, minutes, 0));
    parts = pstFormatter.formatToParts(candidateUTC);
    pstHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    pstMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  }
  
  // If still not correct, adjust iteratively
  if (pstHour !== hours || pstMinute !== minutes) {
    const diff = (hours - pstHour) * 60 + (minutes - pstMinute);
    candidateUTC = new Date(candidateUTC.getTime() + diff * 60 * 1000);
  }
  
  return candidateUTC.toISOString();
}

/**
 * Converts a UTC date to PST date and time strings for form inputs
 * @param utcDateString - ISO string in UTC
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) strings in PST
 */
export function convertUTCToPST(utcDateString: string): { date: string; time: string } {
  const date = new Date(utcDateString);
  
  // Format date in PST (en-CA gives YYYY-MM-DD format)
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  
  // Format time in PST (24-hour format)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  
  return {
    date: dateStr,
    time: timeStr,
  };
}

export function convertGoogleDriveUrl(url: string): string {
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}

export function isImageUrl(url: string): boolean {
  return url.includes('drive.google.com') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
}