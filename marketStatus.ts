import { isTradingDay } from './marketCalendar';
import { MARKET_OPEN_MINUTES } from './time';

export function getMarketStatus(now = new Date()) {
  if (!isTradingDay(now)) {
    return now.getDay() === 0 || now.getDay() === 6
      ? 'Closed for the weekend'
      : 'Closed for a market holiday';
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 4 * 60) return 'Market opens at 9:30 AM';
  if (minutes < MARKET_OPEN_MINUTES) return 'Pre-market is open';
  if (minutes < 16 * 60) return 'Market is open';
  if (minutes < 20 * 60) return 'After-hours is open';
  return 'Market opens at 9:30 AM';
}
