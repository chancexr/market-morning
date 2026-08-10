import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { scannerStyles as styles } from './scannerStyles';
import { loadStockMovers, type StockMover, type StockScanSource } from './stockService';

const priceOptions = [0, 5, 20, 100];
const changeOptions = [0, 2, 5, 10];
const volumeOptions = [0, 1_000_000, 10_000_000, 50_000_000];

function formatVolume(volume: number) {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(volume >= 10_000_000 ? 0 : 1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return String(volume);
}

function FilterChips({ options, value, onChange, format }: { options: number[]; value: number; onChange: (value: number) => void; format: (value: number) => string }) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{format(option)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ScannerScreen() {
  const [stocks, setStocks] = useState<StockMover[]>([]);
  const [source, setSource] = useState<StockScanSource>('demo');
  const [minimumPrice, setMinimumPrice] = useState(5);
  const [minimumChange, setMinimumChange] = useState(2);
  const [minimumVolume, setMinimumVolume] = useState(10_000_000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scanMarket = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadStockMovers();
      setStocks(result.stocks);
      setSource(result.source);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'The scan could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void scanMarket(); }, []);

  const matches = useMemo(() => stocks
    .filter((stock) => stock.price >= minimumPrice)
    .filter((stock) => Math.abs(stock.changePercent) >= minimumChange)
    .filter((stock) => stock.volume >= minimumVolume)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
  [stocks, minimumPrice, minimumChange, minimumVolume]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MARKET SCANNER</Text>
        <Text style={styles.title}>Find momentum.</Text>
        <Text style={styles.subtitle}>Filter top movers and active stocks with one lightweight market-data request.</Text>
      </View>

      <View style={styles.filterCard}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>MINIMUM PRICE</Text>
          <FilterChips options={priceOptions} value={minimumPrice} onChange={setMinimumPrice} format={(value) => value ? `$${value}+` : 'Any'} />
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>MINIMUM MOVE</Text>
          <FilterChips options={changeOptions} value={minimumChange} onChange={setMinimumChange} format={(value) => value ? `${value}%+` : 'Any'} />
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>MINIMUM VOLUME</Text>
          <FilterChips options={volumeOptions} value={minimumVolume} onChange={setMinimumVolume} format={(value) => value ? `${formatVolume(value)}+` : 'Any'} />
        </View>
        <Pressable disabled={loading} onPress={scanMarket} style={[styles.scanButton, loading && styles.scanButtonDisabled]}>
          <Text style={styles.scanButtonText}>{loading ? 'Scanning…' : 'Scan market'}</Text>
        </Pressable>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{matches.length} MATCH{matches.length === 1 ? '' : 'ES'}</Text>
        <View style={styles.sourceBadge}><Text style={styles.sourceText}>{source === 'demo' ? 'DEMO DATA' : 'MARKET DATA'}</Text></View>
      </View>

      {matches.map((stock) => (
        <View key={`${stock.category}-${stock.symbol}`} style={styles.resultCard}>
          <View style={styles.resultTop}>
            <View><Text style={styles.symbol}>{stock.symbol}</Text><Text style={styles.category}>{stock.category}</Text></View>
            <View><Text style={styles.price}>${stock.price.toFixed(2)}</Text><Text style={stock.changePercent >= 0 ? styles.gain : styles.loss}>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</Text></View>
          </View>
          <Text style={styles.volume}>Volume {formatVolume(stock.volume)}</Text>
        </View>
      ))}
      {!loading && matches.length === 0 && <Text style={styles.empty}>No stocks match these filters. Try lowering one of the minimums.</Text>}
      <Text style={styles.disclaimer}>For informational purposes only. Demo values are illustrative and are not live quotes or investment advice.</Text>
    </ScrollView>
  );
}
