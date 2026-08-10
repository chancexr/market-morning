import { isTradingDay } from './marketCalendar';
import { MARKET_OPEN_MINUTES } from './time';

function easternMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function getMarketStatus(now = new Date()) {
  if (!isTradingDay(now)) {
    return now.getDay() === 0 || now.getDay() === 6
      ? 'Closed for the weekend'
      : 'Closed for a market holiday';
  }

  const minutes = easternMinutes(now);
  if (minutes < 4 * 60) return 'Market opens at 9:30 AM';
  if (minutes < MARKET_OPEN_MINUTES) return 'Pre-market is open';
  if (minutes < 16 * 60) return 'Market is open';
  if (minutes < 20 * 60) return 'After-hours is open';
  return 'Market opens at 9:30 AM';
}

export function getNextMarketEvent(now = new Date()) {
  if (!isTradingDay(now)) {
    return { label: 'NEXT UP', title: 'Market opens', time: '9:30 AM ET', detail: 'The next trading session begins on the next market day.' };
  }

  const minutes = easternMinutes(now);
  if (minutes < 4 * 60) return { label: 'NEXT UP', title: 'Pre-market begins', time: '4:00 AM ET', detail: 'Early trading starts soon.' };
  if (minutes < MARKET_OPEN_MINUTES) return { label: 'NEXT UP', title: 'Market opens', time: '9:30 AM ET', detail: 'The regular trading session is almost here.' };
  if (minutes < 16 * 60) return { label: 'NEXT UP', title: 'Market closes', time: '4:00 PM ET', detail: 'Regular trading is currently active.' };
  if (minutes < 20 * 60) return { label: 'NEXT UP', title: 'After-hours ends', time: '8:00 PM ET', detail: 'Extended trading is currently active.' };
  return { label: 'NEXT UP', title: 'Pre-market begins', time: '4:00 AM ET', detail: 'A new trading day starts tomorrow.' };
}
