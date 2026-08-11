import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { loadPortfolio, savePortfolio, type Holding } from './portfolioService';
import { portfolioStyles as styles } from './portfolioStyles';
import { loadStockQuote } from './stockService';

function money(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function PortfolioScreen() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [lastPrice, setLastPrice] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { void loadPortfolio().then(setHoldings); }, []);

  const totals = useMemo(() => holdings.reduce((result, holding) => {
    result.value += holding.shares * holding.currentPrice;
    result.cost += holding.shares * holding.averageCost;
    return result;
  }, { value: 0, cost: 0 }), [holdings]);
  const totalGain = totals.value - totals.cost;

  const addHolding = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    const shareCount = Number(shares);
    const cost = Number(averageCost);
    const price = lastPrice ? Number(lastPrice) : cost;
    if (!cleanSymbol || !Number.isFinite(shareCount) || shareCount <= 0 || !Number.isFinite(cost) || cost <= 0 || !Number.isFinite(price) || price <= 0) {
      Alert.alert('Check the holding', 'Enter a ticker, shares, average cost, and an optional valid last price.');
      return;
    }
    if (holdings.some((holding) => holding.symbol === cleanSymbol)) {
      Alert.alert('Already added', `${cleanSymbol} is already in your portfolio.`);
      return;
    }
    const next = [...holdings, { id: `${Date.now()}-${cleanSymbol}`, symbol: cleanSymbol, shares: shareCount, averageCost: cost, currentPrice: price, updatedAt: new Date().toISOString() }];
    setHoldings(next);
    await savePortfolio(next);
    setSymbol(''); setShares(''); setAverageCost(''); setLastPrice('');
  };

  const removeHolding = (holding: Holding) => {
    Alert.alert(`Remove ${holding.symbol}?`, 'This only removes it from Market Morning.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        const next = holdings.filter((item) => item.id !== holding.id);
        setHoldings(next);
        void savePortfolio(next);
      } },
    ]);
  };

  const refreshPrices = async () => {
    if (!holdings.length) return;
    setRefreshing(true);
    try {
      const next: Holding[] = [];
      for (const holding of holdings) {
        const currentPrice = await loadStockQuote(holding.symbol);
        next.push({ ...holding, currentPrice, updatedAt: new Date().toISOString() });
      }
      setHoldings(next);
      await savePortfolio(next);
    } catch (error) {
      Alert.alert('Price refresh stopped', error instanceof Error ? error.message : 'Prices could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MY PORTFOLIO</Text>
        <Text style={styles.title}>Track what you own.</Text>
        <Text style={styles.subtitle}>Your holdings stay on this phone. No Robinhood password is needed.</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>ESTIMATED VALUE</Text>
        <Text style={styles.summaryValue}>{money(totals.value)}</Text>
        <Text style={totalGain >= 0 ? styles.summaryGain : styles.summaryLoss}>{totalGain >= 0 ? '+' : ''}{money(totalGain)} total gain/loss</Text>
      </View>

      <Text style={styles.sectionTitle}>ADD A HOLDING</Text>
      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}><Text style={styles.inputLabel}>TICKER</Text><TextInput value={symbol} onChangeText={setSymbol} autoCapitalize="characters" placeholder="AAPL" placeholderTextColor="#67738A" style={styles.input} /></View>
          <View style={styles.inputWrap}><Text style={styles.inputLabel}>SHARES</Text><TextInput value={shares} onChangeText={setShares} keyboardType="decimal-pad" placeholder="10" placeholderTextColor="#67738A" style={styles.input} /></View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}><Text style={styles.inputLabel}>AVG COST</Text><TextInput value={averageCost} onChangeText={setAverageCost} keyboardType="decimal-pad" placeholder="150.00" placeholderTextColor="#67738A" style={styles.input} /></View>
          <View style={styles.inputWrap}><Text style={styles.inputLabel}>LAST PRICE (OPTIONAL)</Text><TextInput value={lastPrice} onChangeText={setLastPrice} keyboardType="decimal-pad" placeholder="Current" placeholderTextColor="#67738A" style={styles.input} /></View>
        </View>
        <Pressable onPress={() => void addHolding()} style={styles.addButton}><Text style={styles.addButtonText}>Add to portfolio</Text></Pressable>
        <Text style={styles.helper}>Without a last price, the holding starts at your average cost until market-data refresh is configured.</Text>
      </View>

      <Text style={styles.sectionTitle}>HOLDINGS</Text>
      {!!holdings.length && <Pressable disabled={refreshing} onPress={() => void refreshPrices()} style={styles.refreshButton}><Text style={styles.refreshText}>{refreshing ? 'Refreshing…' : 'Refresh market prices'}</Text></Pressable>}
      {holdings.map((holding) => {
        const gain = holding.shares * (holding.currentPrice - holding.averageCost);
        const percentage = ((holding.currentPrice / holding.averageCost) - 1) * 100;
        return <View key={holding.id} style={styles.holding}>
          <View style={styles.holdingTop}><View><Text style={styles.symbol}>{holding.symbol}</Text><Text style={styles.shares}>{holding.shares} shares · avg {money(holding.averageCost)}</Text></View><View><Text style={styles.holdingValue}>{money(holding.shares * holding.currentPrice)}</Text><Text style={styles.price}>{money(holding.currentPrice)} per share</Text></View></View>
          <View style={styles.holdingFooter}><Text style={gain >= 0 ? styles.gain : styles.loss}>{gain >= 0 ? '+' : ''}{money(gain)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)</Text><Pressable onPress={() => removeHolding(holding)}><Text style={styles.remove}>Remove</Text></Pressable></View>
        </View>;
      })}
      {!holdings.length && <Text style={styles.empty}>No holdings yet. Add your first stock above.</Text>}
      <Text style={styles.disclaimer}>Values are estimates for informational purposes only and are not investment advice.</Text>
    </ScrollView>
  );
}
