import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Handles conditional classes and removes duplicate Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to format dates consistently across the application
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Utility function to generate cryptographically secure unique IDs
 * Uses nanoid for security and collision resistance
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Utility function to capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Utility function to truncate text with ellipsis
 */
export function truncate(str: string, length: number): string {
  return str.length <= length ? str : `${str.substring(0, length)}...`;
}
