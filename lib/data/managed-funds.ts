export interface ManagedFund {
  id: string;
  name: string;
  manager: string;
  type: string;
  minInvestment: number;
  currency: string;
  nav: number;
  yield: number;
  fee: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  inception: string;
  return1y: number;
  return3y: number;
  return5y: number;
  holdings: string;
  description: string;
  assetAllocation: { name: string; value: number }[];
  performanceHistory: { date: string; value: number }[];
}

const generatePerformanceHistory = (startValue: number, volatility: number, trend: number, months: number = 12) => {
  const history = [];
  let value = startValue;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    value = value * (1 + (Math.random() - 0.5) * volatility + trend);
    history.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2))
    });
  }
  return history;
};

export const managedFunds: ManagedFund[] = [
  {
    id: 'qcgef',
    name: 'Kumbra Capital Global Equity Fund',
    manager: 'Kumbra Capital Management',
    type: 'Global Equities',
    minInvestment: 10000,
    currency: 'GBP',
    nav: 1.85,
    yield: 2.1,
    fee: 0.95,
    risk: 'MEDIUM',
    inception: '2020-01-15',
    return1y: 14.8,
    return3y: 10.5,
    return5y: 12.2,
    holdings: 'Microsoft, Apple, Alphabet, Amazon, NVIDIA, Visa, Mastercard, ASML, LVMH, Novo Nordisk',
    description: 'Actively managed global equity portfolio focusing on quality growth companies with sustainable competitive advantages across developed markets.',
    assetAllocation: [
      { name: 'US Equities', value: 60 },
      { name: 'European Equities', value: 25 },
      { name: 'Asia-Pacific', value: 10 },
      { name: 'Cash', value: 5 }
    ],
    performanceHistory: generatePerformanceHistory(1.52, 0.03, 0.012, 12)
  },
  {
    id: 'qcbgf',
    name: 'Kumbra Capital Balanced Growth Fund',
    manager: 'Kumbra Capital Management',
    type: 'Multi-Asset',
    minInvestment: 5000,
    currency: 'GBP',
    nav: 1.42,
    yield: 3.8,
    fee: 0.75,
    risk: 'MEDIUM',
    inception: '2018-06-01',
    return1y: 9.2,
    return3y: 7.8,
    return5y: 8.5,
    holdings: '40% Global Equities, 30% Australian Bonds, 15% International Bonds, 10% Property, 5% Cash',
    description: 'Diversified multi-asset portfolio designed for balanced growth with lower volatility. Suitable for medium-term investors seeking steady returns.',
    assetAllocation: [
      { name: 'Global Equities', value: 40 },
      { name: 'Australian Bonds', value: 30 },
      { name: 'International Bonds', value: 15 },
      { name: 'Property', value: 10 },
      { name: 'Cash', value: 5 }
    ],
    performanceHistory: generatePerformanceHistory(1.28, 0.02, 0.008, 12)
  },
  {
    id: 'qcfif',
    name: 'Kumbra Capital Fixed Income Fund',
    manager: 'Kumbra Capital Management',
    type: 'Fixed Income',
    minInvestment: 10000,
    currency: 'GBP',
    nav: 1.12,
    yield: 5.2,
    fee: 0.45,
    risk: 'LOW',
    inception: '2019-03-20',
    return1y: 5.8,
    return3y: 5.1,
    return5y: 4.9,
    holdings: 'Investment Grade Corporate Bonds, Government Bonds (AU, US, EU), Bank Debt Securities',
    description: 'Conservative fixed income strategy investing in high-quality bonds and debt securities. Focused on capital preservation and stable income generation.',
    assetAllocation: [
      { name: 'Corporate Bonds', value: 45 },
      { name: 'Government Bonds', value: 35 },
      { name: 'Bank Debt', value: 15 },
      { name: 'Cash', value: 5 }
    ],
    performanceHistory: generatePerformanceHistory(1.06, 0.01, 0.004, 12)
  },
  {
    id: 'qcasf',
    name: 'Kumbra Capital Asia Select Fund',
    manager: 'Kumbra Capital Management',
    type: 'Regional Equities',
    minInvestment: 15000,
    currency: 'GBP',
    nav: 1.68,
    yield: 1.8,
    fee: 1.15,
    risk: 'HIGH',
    inception: '2021-09-01',
    return1y: 18.5,
    return3y: 12.8,
    return5y: 0,
    holdings: 'Taiwan Semiconductor, Samsung, Alibaba, Tencent, HDFC Bank, Reliance Industries, BYD, Meituan',
    description: 'High-conviction Asia-focused equity fund capturing growth opportunities in technology, financials, and consumer sectors across emerging Asian markets.',
    assetAllocation: [
      { name: 'China/Hong Kong', value: 35 },
      { name: 'India', value: 25 },
      { name: 'Taiwan', value: 20 },
      { name: 'South Korea', value: 15 },
      { name: 'Cash', value: 5 }
    ],
    performanceHistory: generatePerformanceHistory(1.35, 0.045, 0.015, 12)
  },
  {
    id: 'qcbtc',
    name: 'Kumbra Capital Bitcoin Fund',
    manager: 'Kumbra Capital Management',
    type: 'Cryptocurrency',
    minInvestment: 5000,
    currency: 'GBP',
    nav: 2.42,
    yield: 0,
    fee: 1.25,
    risk: 'HIGH',
    inception: '2022-01-10',
    return1y: 125.3,
    return3y: 45.8,
    return5y: 0,
    holdings: '100% Bitcoin held in institutional-grade cold storage with Coinbase Custody',
    description: 'Pure Bitcoin exposure through a regulated fund structure. Provides institutional-grade custody and secure access to Bitcoin for qualified investors.',
    assetAllocation: [
      { name: 'Bitcoin', value: 98 },
      { name: 'Cash Reserve', value: 2 }
    ],
    performanceHistory: generatePerformanceHistory(1.05, 0.08, 0.055, 12)
  },
  {
    id: 'qcdaf',
    name: 'Kumbra Capital Digital Assets Fund',
    manager: 'Kumbra Capital Management',
    type: 'Digital Assets',
    minInvestment: 10000,
    currency: 'GBP',
    nav: 1.92,
    yield: 0,
    fee: 1.50,
    risk: 'HIGH',
    inception: '2021-07-15',
    return1y: 89.5,
    return3y: 32.4,
    return5y: 0,
    holdings: 'Bitcoin (45%), Ethereum (35%), Solana (8%), Cardano (5%), Polygon (5%), Stablecoins (2%)',
    description: 'Diversified digital asset portfolio providing exposure to leading cryptocurrencies and blockchain platforms. Active management across the crypto ecosystem.',
    assetAllocation: [
      { name: 'Bitcoin', value: 45 },
      { name: 'Ethereum', value: 35 },
      { name: 'Alt Layer-1s', value: 13 },
      { name: 'Layer-2s', value: 5 },
      { name: 'Stablecoins', value: 2 }
    ],
    performanceHistory: generatePerformanceHistory(1.02, 0.07, 0.048, 12)
  },
  {
    id: 'qcdef',
    name: 'Kumbra Capital DeFi Yield Fund',
    manager: 'Kumbra Capital Management',
    type: 'Digital Assets',
    minInvestment: 25000,
    currency: 'GBP',
    nav: 1.35,
    yield: 8.5,
    fee: 1.75,
    risk: 'HIGH',
    inception: '2022-11-01',
    return1y: 42.8,
    return3y: 0,
    return5y: 0,
    holdings: 'DeFi Protocols: Aave, Compound, Uniswap, Curve, Lido Staked ETH, Stablecoins',
    description: 'Sophisticated DeFi strategy generating yield through lending protocols, liquidity provision, and staking. Focus on risk-adjusted returns in decentralized finance.',
    assetAllocation: [
      { name: 'Staked ETH', value: 40 },
      { name: 'Lending Protocols', value: 30 },
      { name: 'DEX Liquidity', value: 20 },
      { name: 'Stablecoins', value: 10 }
    ],
    performanceHistory: generatePerformanceHistory(0.95, 0.05, 0.028, 12)
  }
];

export default managedFunds;
