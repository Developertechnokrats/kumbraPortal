'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: 'GBP/USD', name: 'Pound Sterling', price: 1.2734, change: 0.0023, changePercent: 0.18 },
    { symbol: 'EUR/USD', name: 'Euro', price: 1.0856, change: -0.0012, changePercent: -0.11 },
    { symbol: 'GBP/EUR', name: 'Pound Euro', price: 1.1731, change: 0.0015, changePercent: 0.13 },
    { symbol: 'CHF/USD', name: 'Swiss Franc', price: 1.1342, change: 0.0015, changePercent: 0.13 },
    { symbol: 'GOLD', name: 'Gold', price: 2043.80, change: 12.40, changePercent: 0.61 },
    { symbol: 'SILVER', name: 'Silver', price: 24.12, change: -0.18, changePercent: -0.74 },
    { symbol: 'FTSE', name: 'FTSE 100', price: 7733.25, change: 45.32, changePercent: 0.59 },
    { symbol: 'S&P', name: 'S&P 500', price: 4783.45, change: -12.18, changePercent: -0.25 },
    { symbol: 'OIL', name: 'Brent Crude', price: 77.89, change: 1.23, changePercent: 1.60 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(ticker => {
        const randomChange = (Math.random() - 0.5) * 0.002;
        const newPrice = ticker.price * (1 + randomChange);
        const priceChange = newPrice - ticker.price;
        const percentChange = (priceChange / ticker.price) * 100;

        return {
          ...ticker,
          price: newPrice,
          change: priceChange,
          changePercent: percentChange,
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border-y border-border overflow-hidden">
      <div className="flex animate-ticker">
        <div className="flex gap-8 px-8 py-2">
          {[...tickers, ...tickers].map((ticker, index) => (
            <div key={`${ticker.symbol}-${index}`} className="flex items-center gap-2 whitespace-nowrap min-w-fit">
              <span className="font-semibold text-foreground">{ticker.symbol}</span>
              <span className="text-sm text-muted-foreground">{ticker.price.toFixed(ticker.symbol.includes('/') ? 4 : 2)}</span>
              <span className={`flex items-center text-xs font-medium ${ticker.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {ticker.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {ticker.change >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
