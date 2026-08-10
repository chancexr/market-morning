import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { easternTimeOnDate, getNextTradingDays, isTradingDay } from './marketCalendar';

type MarketReminder = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
};

const MARKET_OPEN_MINUTES = 9 * 60 + 30;

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

function getMarketStatus(now = new Date()) {
  if (!isTradingDay(now)) return now.getDay() === 0 || now.getDay() === 6 ? 'Closed for the weekend' : 'Closed for a market holiday';
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 4 * 60) return 'Market opens at 9:30 AM';
  if (minutes < MARKET_OPEN_MINUTES) return 'Pre-market is open';
  if (minutes < 16 * 60) return 'Market is open';
  if (minutes < 20 * 60) return 'After-hours is open';
  return 'Market opens at 9:30 AM';
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

async function scheduleDateNotification(date: Date, hour: number, minute: number, title: string, body: string) {
  const triggerDate = easternTimeOnDate(date, hour, minute);
  if (triggerDate <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

export default function App() {
  const [wakeMinutes, setWakeMinutes] = useState(7 * 60);
  const [wakeEnabled, setWakeEnabled] = useState(true);
  const [reminders, setReminders] = useState<MarketReminder[]>([
    { id: 'premarket', label: 'Pre-market', time: '4:00 AM', enabled: false },
    { id: 'open', label: 'Market open', time: '9:30 AM', enabled: true },
    { id: 'close', label: 'Market close', time: '4:00 PM', enabled: false },
  ]);

  const marketStatus = useMemo(() => getMarketStatus(), []);

  const updateWakeTime = (delta: number) => {
    setWakeMinutes((current) => (current + delta + 24 * 60) % (24 * 60));
  };

  const toggleReminder = (id: string) => {
    setReminders((current) => current.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const saveSchedule = async () => {
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Notifications are off', 'Allow notifications in Settings so Market Morning can alert you.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('market-morning', {
        name: 'Market Morning alarms',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    const activeReminderCount = reminders.filter((item) => item.enabled).length + (wakeEnabled ? 1 : 0);
    const daysToSchedule = activeReminderCount ? Math.max(1, Math.floor(60 / activeReminderCount)) : 0;
    const upcomingTradingDays = getNextTradingDays(daysToSchedule);
    for (const tradingDay of upcomingTradingDays) {
      if (wakeEnabled) {
        await scheduleDateNotification(tradingDay, Math.floor(wakeMinutes / 60), wakeMinutes % 60, 'Good morning', 'Your day starts now. The market opens at 9:30 AM ET.');
      }
      for (const reminder of reminders.filter((item) => item.enabled)) {
        const [time, suffix] = reminder.time.split(' ');
        const [rawHour, rawMinute] = time.split(':').map(Number);
        const hour = suffix === 'PM' && rawHour !== 12 ? rawHour + 12 : suffix === 'AM' && rawHour === 12 ? 0 : rawHour;
        await scheduleDateNotification(tradingDay, hour, rawMinute, reminder.label, `${reminder.label} starts now.`);
      }
    }
    Alert.alert('Schedule saved', `Your next ${upcomingTradingDays.length} market days are scheduled. Open the app occasionally to refresh your schedule.`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MARKET MORNING</Text>
          <Text style={styles.title}>Wake up ready.</Text>
          <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>{marketStatus}</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View><Text style={styles.cardLabel}>WEEKDAY WAKE-UP</Text><Text style={styles.helper}>A gentle start before the bell.</Text></View>
            <Switch value={wakeEnabled} onValueChange={setWakeEnabled} trackColor={{ false: '#303647', true: '#63E6BE' }} />
          </View>
          <View style={styles.timeControl}>
            <Pressable onPress={() => updateWakeTime(-15)} style={styles.timeButton}><Text style={styles.timeButtonText}>−</Text></Pressable>
            <Text style={styles.time}>{minutesToTime(wakeMinutes)}</Text>
            <Pressable onPress={() => updateWakeTime(15)} style={styles.timeButton}><Text style={styles.timeButtonText}>+</Text></Pressable>
          </View>
          <Text style={styles.timeHint}>Tap − or + to adjust by 15 minutes</Text>
        </View>

        <Text style={styles.sectionTitle}>MARKET REMINDERS</Text>
        <View style={styles.card}>
          {reminders.map((reminder, index) => (
            <View key={reminder.id} style={[styles.reminder, index > 0 && styles.divider]}>
              <View><Text style={styles.reminderLabel}>{reminder.label}</Text><Text style={styles.reminderTime}>{reminder.time} ET · Weekdays</Text></View>
              <Switch value={reminder.enabled} onValueChange={() => toggleReminder(reminder.id)} trackColor={{ false: '#303647', true: '#63E6BE' }} />
            </View>
          ))}
        </View>

        <View style={styles.note}><Text style={styles.noteTitle}>Simple by design</Text><Text style={styles.noteText}>No accounts or price feed. Weekend and major NYSE holiday reminders are skipped automatically.</Text></View>
        <Pressable style={styles.saveButton} onPress={saveSchedule}><Text style={styles.saveText}>Save my schedule</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0E16' },
  content: { padding: 24, paddingBottom: 42 },
  header: { paddingTop: 22, marginBottom: 28 },
  eyebrow: { color: '#63E6BE', fontWeight: '800', fontSize: 12, letterSpacing: 1.6 },
  title: { color: '#F8FAFC', fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 7 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#172031', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8, marginTop: 18 },
  statusDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#63E6BE', marginRight: 8 },
  statusText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#141925', borderColor: '#232B3B', borderWidth: 1, borderRadius: 20, padding: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  helper: { color: '#8994A8', fontSize: 13, marginTop: 4 },
  timeControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23 },
  time: { color: '#F8FAFC', fontSize: 36, fontWeight: '800', letterSpacing: -1.2 },
  timeButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#20293A', width: 44, height: 44, borderRadius: 22 },
  timeButtonText: { color: '#63E6BE', fontSize: 27, fontWeight: '500', marginTop: -3 },
  timeHint: { color: '#67738A', textAlign: 'center', fontSize: 12, marginTop: 12 },
  sectionTitle: { color: '#8994A8', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginTop: 30, marginBottom: 10 },
  reminder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  divider: { borderTopColor: '#232B3B', borderTopWidth: 1, marginTop: 9, paddingTop: 19 },
  reminderLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  reminderTime: { color: '#8994A8', fontSize: 13, marginTop: 4 },
  note: { backgroundColor: '#112C2B', borderRadius: 16, padding: 16, marginTop: 20 },
  noteTitle: { color: '#A7F3D0', fontSize: 14, fontWeight: '800' },
  noteText: { color: '#C7E8DD', fontSize: 13, lineHeight: 19, marginTop: 4 },
  saveButton: { backgroundColor: '#63E6BE', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 22 },
  saveText: { color: '#09201B', fontSize: 16, fontWeight: '800' },
});
