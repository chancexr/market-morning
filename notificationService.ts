import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { easternTimeOnDate, getNextTradingDays } from './marketCalendar';
import { timeStringTo24Hour } from './time';
import type { MarketReminder } from './types';

const MAX_PENDING_NOTIFICATIONS = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function scheduleNotification(date: Date, hour: number, minute: number, title: string, body: string) {
  const triggerDate = easternTimeOnDate(date, hour, minute);
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

export async function saveNotificationSchedule(
  wakeEnabled: boolean,
  wakeMinutes: number,
  reminders: MarketReminder[],
) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('market-morning', {
      name: 'Market Morning alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const enabledReminders = reminders.filter((reminder) => reminder.enabled);
  const notificationsPerDay = enabledReminders.length + (wakeEnabled ? 1 : 0);
  const daysToSchedule = notificationsPerDay
    ? Math.max(1, Math.floor(MAX_PENDING_NOTIFICATIONS / notificationsPerDay))
    : 0;
  const upcomingTradingDays = getNextTradingDays(daysToSchedule);

  for (const tradingDay of upcomingTradingDays) {
    if (wakeEnabled) {
      await scheduleNotification(
        tradingDay,
        Math.floor(wakeMinutes / 60),
        wakeMinutes % 60,
        'Good morning',
        'Your day starts now. The market opens at 9:30 AM ET.',
      );
    }

    for (const reminder of enabledReminders) {
      const { hour, minute } = timeStringTo24Hour(reminder.time);
      await scheduleNotification(tradingDay, hour, minute, reminder.label, `${reminder.label} starts now.`);
    }
  }

  return upcomingTradingDays.length;
}
