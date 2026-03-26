/**
 * Format epoch milliseconds into a human-readable date/time string.
 */
export function formatDateTime(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format epoch milliseconds into a short time string (HH:mm:ss).
 */
export function formatTime(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Format seconds into a human-readable uptime string (e.g. "2h 15m 30s").
 */
export function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (h > 0) {
    parts.push(`${h}h`);
  }
  if (m > 0) {
    parts.push(`${m}m`);
  }
  if (s > 0) {
    parts.push(`${s}s`);
  }
  return parts.join(' ');
}

/**
 * Truncate a phone number for display, masking middle digits.
 * e.g. "+639171234567" -> "+6391****4567"
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length <= 7) {
    return phone;
  }
  const start = phone.slice(0, 5);
  const end = phone.slice(-4);
  return `${start}****${end}`;
}

/**
 * Truncate message text for list display.
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
