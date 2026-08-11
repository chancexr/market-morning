import AsyncStorage from '@react-native-async-storage/async-storage';

export type AlarmSound = 'default' | 'market-bell.wav' | 'gentle-chime.wav';

export const alarmSoundOptions: { id: AlarmSound; label: string; description: string }[] = [
  { id: 'default', label: 'System default', description: 'The standard notification sound.' },
  { id: 'market-bell.wav', label: 'Market bell', description: 'A brighter two-tone trading bell.' },
  { id: 'gentle-chime.wav', label: 'Gentle chime', description: 'A softer three-note morning sound.' },
];

const STORAGE_KEY = 'market-morning.alarm-sound';

export async function loadAlarmSound(): Promise<AlarmSound> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return alarmSoundOptions.some((option) => option.id === stored) ? stored as AlarmSound : 'default';
}

export async function saveAlarmSound(sound: AlarmSound) {
  await AsyncStorage.setItem(STORAGE_KEY, sound);
}

export function soundChannelId(sound: AlarmSound) {
  return `market-morning-${sound.replace('.wav', '')}`;
}
