import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { easternTimeOnDate, getNextTradingDays } from './marketCalendar';
import { timeStringTo24Hour } from './time';
import type { MarketReminder } from './types';
import { soundChannelId, type AlarmSound } from './alarmSettings';

const MAX_PENDING_NOTIFICATIONS = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(sound: AlarmSound) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(soundChannelId(sound), {
    name: `Market Morning — ${sound === 'default' ? 'Default' : sound.replace('.wav', '')}`,
    importance: Notifications.AndroidImportance.MAX,
    sound,
  });
}

async function scheduleNotification(date: Date, hour: number, minute: number, title: string, body: string, sound: AlarmSound) {
  const triggerDate = easternTimeOnDate(date, hour, minute);
  if (triggerDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: soundChannelId(sound) },
  });
}

export async function saveNotificationSchedule(
  wakeEnabled: boolean,
  wakeMinutes: number,
  reminders: MarketReminder[],
  sound: AlarmSound,
) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  await ensureAndroidChannel(sound);

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
        sound,
      );
    }

    for (const reminder of enabledReminders) {
      const { hour, minute } = timeStringTo24Hour(reminder.time);
      await scheduleNotification(tradingDay, hour, minute, reminder.label, `${reminder.label} starts now.`, sound);
    }
  }

  return upcomingTradingDays.length;
}

export async function testAlarmSound(sound: AlarmSound) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted || permission.ios?.allowsSound === false) return false;
  await ensureAndroidChannel(sound);
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Market Morning sound test', body: 'Your alarm sound is working.', sound },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 7, channelId: soundChannelId(sound) },
  });
  return true;
}
