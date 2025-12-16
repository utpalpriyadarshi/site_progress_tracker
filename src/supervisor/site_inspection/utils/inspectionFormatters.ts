import { InspectionType, OverallRating } from '../types';

/**
 * Get color code for inspection type chip
 *
 * @param type - Inspection type
 * @returns Hex color string
 */
export function getInspectionTypeColor(type: InspectionType): string {
  switch (type) {
    case 'daily':
      return '#2196F3'; // Blue
    case 'weekly':
      return '#4CAF50'; // Green
    case 'safety':
      return '#FF9800'; // Orange
    case 'quality':
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Gray
  }
}

/**
 * Get color code for rating chip
 *
 * @param rating - Overall rating
 * @returns Hex color string
 */
export function getRatingColor(rating: OverallRating): string {
  switch (rating) {
    case 'excellent':
      return '#4CAF50'; // Green
    case 'good':
      return '#8BC34A'; // Light Green
    case 'fair':
      return '#FF9800'; // Orange
    case 'poor':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
}

/**
 * Format timestamp to locale date string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string (e.g., "12/9/2025, 3:45:30 PM")
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format timestamp to short date string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Short formatted date (e.g., "12/9/2025")
 */
export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format timestamp to time string
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "3:45 PM")
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get display label for inspection type
 *
 * @param type - Inspection type
 * @returns Uppercase label
 */
export function getInspectionTypeLabel(type: InspectionType): string {
  return type.toUpperCase();
}

/**
 * Get display label for rating
 *
 * @param rating - Overall rating
 * @returns Uppercase label
 */
export function getRatingLabel(rating: OverallRating): string {
  return rating.toUpperCase();
}
