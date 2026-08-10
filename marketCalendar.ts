/** U.S. equities trading calendar helpers for local notification scheduling. */
function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function observedDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  if (date.getDay() === 6) date.setDate(day - 1);
  if (date.getDay() === 0) date.setDate(day + 1);
  return date;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
  const date = new Date(year, month, 1);
  const offset = (weekday - date.getDay() + 7) % 7;
  date.setDate(1 + offset + 7 * (occurrence - 1));
  return date;
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number) {
  const date = new Date(year, month + 1, 0);
  const offset = (date.getDay() - weekday + 7) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}

export function marketHolidayKeys(year: number) {
  const goodFriday = easterSunday(year);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const juneteenth = observedDate(year, 5, 19);
  const holidays = [
    observedDate(year, 0, 1),
    observedDate(year + 1, 0, 1), // Covers a next-year Saturday New Year's Day observed on Dec. 31.
    nthWeekdayOfMonth(year, 0, 1, 3), // Martin Luther King Jr. Day
    nthWeekdayOfMonth(year, 1, 1, 3), // Presidents Day
    goodFriday,
    lastWeekdayOfMonth(year, 4, 1), // Memorial Day
    juneteenth,
    observedDate(year, 6, 4),
    nthWeekdayOfMonth(year, 8, 1, 1), // Labor Day
    nthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving
    observedDate(year, 11, 25),
  ];
  return new Set(holidays.map(toKey));
}

export function isTradingDay(date: Date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !marketHolidayKeys(date.getFullYear()).has(toKey(date));
}

export function getNextTradingDays(numberOfDays: number, start = new Date()) {
  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (days.length < numberOfDays) {
    if (isTradingDay(cursor)) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function easternOffsetMinutes(date: Date) {
  const zoneName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value;
  const match = zoneName?.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return -300;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** Creates a device-local Date for a clock time expressed in U.S. Eastern Time. */
export function easternTimeOnDate(day: Date, hour: number, minute: number) {
  const utcGuess = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute));
  return new Date(utcGuess.getTime() - easternOffsetMinutes(utcGuess) * 60_000);
}
