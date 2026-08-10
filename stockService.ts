export type StockMover = {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
  category: 'Gainer' | 'Loser' | 'Active';
};

export type StockScanSource = 'demo' | 'market';

type AlphaVantageMover = {
  ticker: string;
  price: string;
  change_percentage: string;
  volume: string;
};

type AlphaVantageResponse = {
  top_gainers?: AlphaVantageMover[];
  top_losers?: AlphaVantageMover[];
  most_actively_traded?: AlphaVantageMover[];
  Information?: string;
  Note?: string;
};

const demoStocks: StockMover[] = [
  { symbol: 'NVDA', price: 182.72, changePercent: 6.41, volume: 196_400_000, category: 'Gainer' },
  { symbol: 'AMD', price: 214.18, changePercent: 4.86, volume: 87_200_000, category: 'Gainer' },
  { symbol: 'PLTR', price: 168.54, changePercent: 3.72, volume: 74_800_000, category: 'Gainer' },
  { symbol: 'SOFI', price: 22.16, changePercent: 2.91, volume: 63_100_000, category: 'Active' },
  { symbol: 'AAPL', price: 238.42, changePercent: 1.28, volume: 51_900_000, category: 'Active' },
  { symbol: 'F', price: 13.08, changePercent: -1.84, volume: 48_300_000, category: 'Active' },
  { symbol: 'RIVN', price: 17.34, changePercent: -3.12, volume: 39_700_000, category: 'Loser' },
  { symbol: 'SNAP', price: 9.61, changePercent: -5.27, volume: 56_200_000, category: 'Loser' },
];

function convertMover(mover: AlphaVantageMover, category: StockMover['category']): StockMover {
  return {
    symbol: mover.ticker,
    price: Number(mover.price),
    changePercent: Number(mover.change_percentage.replace('%', '')),
    volume: Number(mover.volume),
    category,
  };
}

export async function loadStockMovers(): Promise<{ stocks: StockMover[]; source: StockScanSource }> {
  const apiKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY;
  if (!apiKey) return { stocks: demoStocks, source: 'demo' };

  const response = await fetch(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${encodeURIComponent(apiKey)}`);
  if (!response.ok) throw new Error('The market-data service could not be reached.');

  const data = await response.json() as AlphaVantageResponse;
  if (data.Information || data.Note || !data.top_gainers) {
    throw new Error(data.Information || data.Note || 'Market data is temporarily unavailable.');
  }

  return {
    source: 'market',
    stocks: [
      ...data.top_gainers.map((stock) => convertMover(stock, 'Gainer')),
      ...(data.top_losers ?? []).map((stock) => convertMover(stock, 'Loser')),
      ...(data.most_actively_traded ?? []).map((stock) => convertMover(stock, 'Active')),
    ],
  };
}
