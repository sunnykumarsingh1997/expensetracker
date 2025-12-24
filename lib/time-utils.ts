// Time Log Utility Functions

import { TimeLog, TimeLogSettings, DayCompletionStatus } from './types';

/**
 * Generate time slots based on start/end hours and duration
 */
export function generateTimeSlots(
  startHour: string,
  endHour: string,
  slotDuration: number = 60
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startHour.split(':').map(Number);
  const [endH, endM] = endHour.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes < endMinutes) {
    const slotStart = formatMinutesToTime(currentMinutes);
    const slotEnd = formatMinutesToTime(currentMinutes + slotDuration);
    slots.push(`${slotStart} - ${slotEnd}`);
    currentMinutes += slotDuration;
  }

  return slots;
}

/**
 * Convert minutes to HH:MM format
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to minutes
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Parse natural language time range
 * Handles: "10 to 12", "10:00 - 12:00", "10 baje se 12 baje"
 */
export function parseTimeRange(text: string): { start: string; end: string } | null {
  // Normalize text
  const normalized = text
    .toLowerCase()
    .replace(/baje|bajay|bajey/gi, '')
    .replace(/se|to|till|until|-/gi, ' to ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try to extract two numbers
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(?:am|pm)?\s*to\s*(\d{1,2}):?(\d{2})?\s*(?:am|pm)?/i;
  const match = normalized.match(timePattern);

  if (match) {
    const startH = parseInt(match[1]);
    const startM = match[2] ? parseInt(match[2]) : 0;
    const endH = parseInt(match[3]);
    const endM = match[4] ? parseInt(match[4]) : 0;

    return {
      start: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
      end: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
    };
  }

  // Simple number extraction
  const numbers = normalized.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const startH = parseInt(numbers[0]);
    const endH = parseInt(numbers[1]);
    return {
      start: `${startH.toString().padStart(2, '0')}:00`,
      end: `${endH.toString().padStart(2, '0')}:00`,
    };
  }

  return null;
}

/**
 * Get slots covered by a time range
 */
export function getSlotsInRange(
  start: string,
  end: string,
  allSlots: string[]
): string[] {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  return allSlots.filter(slot => {
    const [slotStart] = slot.split(' - ');
    const slotMinutes = parseTimeToMinutes(slotStart);
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

/**
 * Calculate completion status for a day
 */
export function calculateCompletion(
  logs: TimeLog[],
  totalSlots: number,
  date: string
): DayCompletionStatus {
  const dateLogs = logs.filter(log => log.date === date);
  const filledSlots = dateLogs.filter(log => log.activity && log.activity.trim() !== '').length;
  const isSubmitted = dateLogs.some(log => log.isSubmitted);

  return {
    date,
    totalSlots,
    filledSlots,
    isComplete: filledSlots >= totalSlots,
    isSubmitted,
  };
}

/**
 * Check if a time slot is within working hours
 */
export function isValidTimeSlot(slot: string, settings: TimeLogSettings): boolean {
  const [slotStart, slotEnd] = slot.split(' - ');
  const startMinutes = parseTimeToMinutes(slotStart);
  const endMinutes = parseTimeToMinutes(slotEnd);
  const settingsStart = parseTimeToMinutes(settings.startHour);
  const settingsEnd = parseTimeToMinutes(settings.endHour);

  return startMinutes >= settingsStart && endMinutes <= settingsEnd;
}

/**
 * Format a time slot for display
 */
export function formatTimeSlotDisplay(slot: string): string {
  const [start, end] = slot.split(' - ');
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate unique ID for time log
 */
export function generateTimeLogId(): string {
  return `tl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get list of dates for history view
 */
export function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}
