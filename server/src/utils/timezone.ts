/**
 * Resolves user's local date and time given an IANA timezone string.
 * Uses standard Intl.DateTimeFormat (no external dependency needed).
 */
export interface UserLocalDateTime {
  localDate: string; // YYYY-MM-DD
  localTime: string; // HH:mm (24-hour)
  hour: number;
  minute: number;
  timezone: string;
}

export function getUserLocalDateTime(
  timezone: string = 'UTC',
  referenceDate: Date = new Date()
): UserLocalDateTime {
  const safeTimezone = isValidTimezone(timezone) ? timezone : 'UTC';

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(referenceDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hourStr = getPart('hour');
    const minuteStr = getPart('minute');

    const localDate = `${year}-${month}-${day}`;
    const localTime = `${hourStr}:${minuteStr}`;
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    return {
      localDate,
      localTime,
      hour,
      minute,
      timezone: safeTimezone,
    };
  } catch {
    // Fallback to UTC
    const iso = referenceDate.toISOString();
    const localDate = iso.split('T')[0];
    const hourStr = String(referenceDate.getUTCHours()).padStart(2, '0');
    const minuteStr = String(referenceDate.getUTCMinutes()).padStart(2, '0');

    return {
      localDate,
      localTime: `${hourStr}:${minuteStr}`,
      hour: referenceDate.getUTCHours(),
      minute: referenceDate.getUTCMinutes(),
      timezone: 'UTC',
    };
  }
}

/**
 * Validates if an IANA timezone string is recognized by Intl.
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
