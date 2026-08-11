import AsyncStorage from '@react-native-async-storage/async-storage';

export type Holding = {
  id: string;
  symbol: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  updatedAt: string;
};

const STORAGE_KEY = 'market-morning.portfolio';

export async function loadPortfolio(): Promise<Holding[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Holding[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function savePortfolio(holdings: Holding[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}
