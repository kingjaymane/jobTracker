import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date utility functions to avoid timezone issues
export function formatDateForStorage(date: Date): string {
  // Use local date parts to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateFromStorage(dateString: string): Date {
  // Parse the date string and create a date in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
