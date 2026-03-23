export function formatAssetClass(assetClass: string): string {
  const mapping: Record<string, string> = {
    'FIXED_INCOME': 'Bonds',
    'BOND': 'Bonds',
    'BONDS': 'Bonds',
    'MANAGED_FUND': 'Managed Funds',
    'FUND': 'Managed Funds',
    'FUNDS': 'Managed Funds',
    'GOLD': 'Gold Contracts',
    'GOLD_CONTRACT': 'Gold Contracts',
    'PRECIOUS_METALS': 'Gold Contracts',
    'EQUITY': 'Equities',
    'EQUITIES': 'Equities',
    'STOCK': 'Equities',
    'STOCKS': 'Equities',
    'CASH': 'Cash',
    'PROPERTY': 'Property',
    'REAL_ESTATE': 'Property',
    'ALTERNATIVE': 'Alternatives',
    'OTHER': 'Other',
  };

  const normalized = assetClass.toUpperCase().replace(/\s+/g, '_');
  return mapping[normalized] || assetClass.split('_').map(word =>
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
}

export function formatCurrency(amount: number | undefined | null, currency: string = 'GBP', locale: string = 'en-GB'): string {
  const currencySymbols: Record<string, string> = {
    'GBP': '£',
    'USD': '$',
    'EUR': '€',
  };

  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }

  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (currency === 'EUR') {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
