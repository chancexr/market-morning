export const MARKET_OPEN_MINUTES = 9 * 60 + 30;

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

export function timeStringTo24Hour(timeString: string) {
  const [time, suffix] = timeString.split(' ');
  const [rawHour, minute] = time.split(':').map(Number);
  if (suffix === 'PM' && rawHour !== 12) return { hour: rawHour + 12, minute };
  if (suffix === 'AM' && rawHour === 12) return { hour: 0, minute };
  return { hour: rawHour, minute };
}
