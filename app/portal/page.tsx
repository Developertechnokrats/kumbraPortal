'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  FileText,
  PieChart as PieChartIcon,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  Wallet,
  Briefcase,
  ChevronRight,
  Rocket,
  Percent,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Link from 'next/link';
import Image from 'next/image';
import { formatAssetClass, formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';

const CHART_COLORS = [
  { base: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
  { base: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
  { base: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
  { base: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
  { base: '#10b981', light: '#34d399', dark: '#059669' },
  { base: '#ec4899', light: '#f472b6', dark: '#db2777' },
  { base: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
  { base: '#14b8a6', light: '#2dd4bf', dark: '#0d9488' },
];

const IPO_LOGOS: Record<string, string> = {
  'SpaceX': '/spacex_logo_black.png',
  'Stripe': '/stripe_logo.png',
  'Discord': '/discord1.png',
  'Databricks': '/databricks_logo.png',
  'Klarna': '/klarna-logo.png',
  'Impossible Foods': '/impossible_foods_logo.svg.png',
  'Plaid': '/plaid-logo.png',
  'Chime': '/chime_thumb.png',
};

const generatePerformanceHistory = (currentValue: number, totalInvested: number) => {
  const today = new Date();
  const data = [];
  const baseValue = totalInvested * 0.6;

  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);

    const monthsFromStart = 60 - i;
    const growthFactor = 1 + (monthsFromStart * 0.012);
    const volatility = Math.sin(monthsFromStart * 0.3) * 0.05;
    const seasonality = Math.cos(monthsFromStart * 0.52) * 0.03;
    const trend = Math.pow(1.008, monthsFromStart);

    let value = baseValue * growthFactor * trend * (1 + volatility + seasonality);

    if (i <= 12) {
      const recentGrowth = ((currentValue - baseValue * growthFactor * trend) / 12) * (12 - i);
      value = baseValue * growthFactor * trend * (1 + volatility * 0.3) + recentGrowth;
    }

    if (i === 0) value = currentValue;

    data.push({
      date: date.toISOString().slice(0, 7),
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.max(value, baseValue * 0.8),
      invested: baseValue + (totalInvested - baseValue) * (monthsFromStart / 60),
    });
  }

  return data;
};

interface PieSliceData {
  name: string;
  value: number;
  percentage: string;
  color: typeof CHART_COLORS[0];
  logo?: string;
}

interface Interactive3DPieProps {
  data: PieSliceData[];
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  totalValue: number;
  currency?: string;
  showLogos?: boolean;
  title: string;
}

function Interactive3DPie({ data, hoveredIndex, setHoveredIndex, totalValue, currency, showLogos, title }: Interactive3DPieProps) {
  let cumulativeAngle = 0;
  const slices = data.map((item, index) => {
    const angle = (parseFloat(item.percentage) / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const midAngle = (startAngle + endAngle) / 2;
    const isHovered = hoveredIndex === index;
    const translateDistance = isHovered ? 18 : 0;
    const translateX = Math.cos((midAngle - 90) * Math.PI / 180) * translateDistance;
    const translateY = Math.sin((midAngle - 90) * Math.PI / 180) * translateDistance;

    return { ...item, startAngle, endAngle, midAngle, translateX, translateY, isHovered, index };
  });

  const createSlicePath = (startAngle: number, endAngle: number, radius: number, cx: number, cy: number) => {
    const start = {
      x: cx + radius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: cy + radius * Math.sin((startAngle - 90) * Math.PI / 180),
    };
    const end = {
      x: cx + radius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: cy + radius * Math.sin((endAngle - 90) * Math.PI / 180),
    };
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  const cx = 180;
  const cy = 180;
  const radius = 140;

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative flex items-center gap-8">
          <div
            className="relative transition-transform duration-500 ease-out"
            style={{
              transform: 'perspective(1000px) rotateX(55deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <svg width="360" height="360" viewBox="0 0 360 360" className="drop-shadow-2xl">
              <defs>
                {slices.map((slice, i) => (
                  <linearGradient key={`grad-${i}`} id={`gradient-${title}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={slice.color.light} />
                    <stop offset="50%" stopColor={slice.color.base} />
                    <stop offset="100%" stopColor={slice.color.dark} />
                  </linearGradient>
                ))}
                <filter id={`shadow-${title}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.3"/>
                </filter>
                <filter id={`glow-${title}`}>
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {slices.map((slice, i) => (
                <g key={i}>
                  <path
                    d={createSlicePath(slice.startAngle, slice.endAngle, radius, cx, cy)}
                    fill={slice.color.dark}
                    transform={`translate(${slice.translateX}, ${slice.translateY + 25})`}
                    opacity="0.5"
                  />
                </g>
              ))}

              {slices.map((slice, i) => (
                <g
                  key={`top-${i}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                  style={{
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: `translate(${slice.translateX}px, ${slice.translateY}px)`,
                  }}
                >
                  <path
                    d={createSlicePath(slice.startAngle, slice.endAngle, radius, cx, cy)}
                    fill={`url(#gradient-${title}-${i})`}
                    filter={slice.isHovered ? `url(#glow-${title})` : `url(#shadow-${title})`}
                    className="transition-all duration-300"
                    style={{
                      opacity: hoveredIndex === null || slice.isHovered ? 1 : 0.6,
                    }}
                  />
                  <path
                    d={createSlicePath(slice.startAngle, slice.endAngle, radius, cx, cy)}
                    fill="transparent"
                    stroke="white"
                    strokeWidth={slice.isHovered ? 3 : 1}
                    strokeOpacity={slice.isHovered ? 0.9 : 0.3}
                  />
                </g>
              ))}

              <circle cx={cx} cy={cy} r="55" fill="white" className="dark:fill-slate-900" filter={`url(#shadow-${title})`} />
              <circle cx={cx} cy={cy} r="52" fill="white" className="dark:fill-slate-800" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
          </div>

          <div
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl border p-5 transition-all duration-300 min-w-[220px] ${
              hoveredIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {hoveredIndex !== null && slices[hoveredIndex] && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {showLogos && slices[hoveredIndex].logo ? (
                    <div className="w-12 h-12 rounded-lg bg-white border shadow-sm flex items-center justify-center overflow-hidden p-1">
                      <Image
                        src={slices[hoveredIndex].logo!}
                        alt={slices[hoveredIndex].name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full shadow-inner"
                      style={{ backgroundColor: slices[hoveredIndex].color.base }}
                    />
                  )}
                  <span className="font-semibold text-lg">{slices[hoveredIndex].name}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{formatCurrency(slices[hoveredIndex].value, currency)}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${slices[hoveredIndex].percentage}%`,
                          backgroundColor: slices[hoveredIndex].color.base,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{slices[hoveredIndex].percentage}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Total Value</p>
        <p className="text-2xl font-bold">{formatCurrency(totalValue, currency)}</p>
      </div>

      <div className="mt-4 px-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {data.map((item, index) => (
            <button
              key={index}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                hoveredIndex === index
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {showLogos && item.logo ? (
                <div className="w-4 h-4 rounded overflow-hidden bg-white flex items-center justify-center">
                  <Image src={item.logo!} alt={item.name} width={14} height={14} className="object-contain" />
                </div>
              ) : (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color.base }}
                />
              )}
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { client, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pieChartView, setPieChartView] = useState<'asset' | 'currency' | 'ipo'>('asset');
  const [performanceChart, setPerformanceChart] = useState<'area' | 'line' | 'bar'>('area');
  const [performancePeriod, setPerformancePeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL'>('1Y');
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any>({
    totalInvested: 0,
    currentValue: 0,
    unrealisedPL: 0,
    plPercentage: 0,
    cashBalances: [],
    holdings: [],
    upcomingCashflows: [],
    recentTransactions: [],
    assetAllocation: [],
    currencyAllocation: [],
    ipoAllocation: [],
    performanceData: [],
  });

  useEffect(() => {
    if (!authLoading && client) {
      loadDashboardData();
    }
  }, [client, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [balancesRes, holdingsRes, cashflowsRes, transactionsRes] = await Promise.all([
        supabase.from('client_cash_accounts').select('*').eq('client_id', client!.id),
        supabase.from('holdings').select('*, instrument:instruments(*)').eq('client_id', client!.id).eq('status', 'ACTIVE'),
        supabase.from('cashflows').select('*, holding:holdings(*, instrument:instruments(*))').eq('client_id', client!.id).eq('paid', false).order('date', { ascending: true }).limit(5),
        supabase.from('transactions').select('*').eq('client_id', client!.id).order('created_at', { ascending: false }).limit(10),
      ]);

      const holdings = (holdingsRes.data || []) as any[];
      const totalInvested = holdings.reduce((sum, h) => sum + parseFloat(h.cost_basis.toString()), 0);
      const currentValue = holdings.reduce((sum, h) => sum + parseFloat(h.current_value.toString()), 0);
      const unrealisedPL = currentValue - totalInvested;
      const plPercentage = totalInvested > 0 ? ((unrealisedPL / totalInvested) * 100) : 0;

      const assetClassMap: Record<string, number> = {};
      const currencyMap: Record<string, number> = {};
      const ipoMap: Record<string, { value: number; logo?: string }> = {};

      holdings.forEach((h: any) => {
        const assetClass = h.instrument?.asset_class || 'OTHER';
        const currency = h.currency || 'GBP';
        const issuerName = h.instrument?.issuer_name || 'Unknown';

        assetClassMap[assetClass] = (assetClassMap[assetClass] || 0) + parseFloat(h.current_value.toString());
        currencyMap[currency] = (currencyMap[currency] || 0) + parseFloat(h.current_value.toString());

        if (assetClass === 'PRE_IPO') {
          if (!ipoMap[issuerName]) {
            ipoMap[issuerName] = { value: 0, logo: IPO_LOGOS[issuerName] };
          }
          ipoMap[issuerName].value += parseFloat(h.current_value.toString());
        }
      });

      const assetAllocation = Object.entries(assetClassMap).map(([name, value], index) => ({
        name: formatAssetClass(name),
        rawName: name,
        value,
        percentage: ((value / currentValue) * 100).toFixed(1),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

      const currencyAllocation = Object.entries(currencyMap).map(([name, value], index) => ({
        name,
        value,
        percentage: ((value / currentValue) * 100).toFixed(1),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

      const ipoTotal = Object.values(ipoMap).reduce((sum, item) => sum + item.value, 0);
      const ipoAllocation = Object.entries(ipoMap).map(([name, data], index) => ({
        name,
        value: data.value,
        percentage: ipoTotal > 0 ? ((data.value / ipoTotal) * 100).toFixed(1) : '0',
        color: CHART_COLORS[index % CHART_COLORS.length],
        logo: data.logo,
      }));

      const performanceData = generatePerformanceHistory(currentValue || 500000, totalInvested || 400000);

      setDashboardData({
        totalInvested: totalInvested || 400000,
        currentValue: currentValue || 500000,
        unrealisedPL: unrealisedPL || 100000,
        plPercentage: plPercentage || 25,
        cashBalances: balancesRes.data || [],
        holdings,
        upcomingCashflows: cashflowsRes.data || [],
        recentTransactions: transactionsRes.data || [],
        assetAllocation: assetAllocation.length > 0 ? assetAllocation : [
          { name: 'Fixed Income', value: 200000, percentage: '40.0', color: CHART_COLORS[0] },
          { name: 'Pre-IPO', value: 150000, percentage: '30.0', color: CHART_COLORS[1] },
          { name: 'Managed Funds', value: 100000, percentage: '20.0', color: CHART_COLORS[2] },
          { name: 'Cash', value: 50000, percentage: '10.0', color: CHART_COLORS[3] },
        ],
        currencyAllocation: currencyAllocation.length > 0 ? currencyAllocation : [
          { name: 'USD', value: 250000, percentage: '50.0', color: CHART_COLORS[0] },
          { name: 'GBP', value: 150000, percentage: '30.0', color: CHART_COLORS[1] },
          { name: 'EUR', value: 100000, percentage: '20.0', color: CHART_COLORS[2] },
        ],
        ipoAllocation: ipoAllocation.length > 0 ? ipoAllocation : [
          { name: 'SpaceX', value: 50000, percentage: '33.3', color: CHART_COLORS[0], logo: IPO_LOGOS['SpaceX'] },
          { name: 'Stripe', value: 40000, percentage: '26.7', color: CHART_COLORS[1], logo: IPO_LOGOS['Stripe'] },
          { name: 'Discord', value: 35000, percentage: '23.3', color: CHART_COLORS[2], logo: IPO_LOGOS['Discord'] },
          { name: 'Databricks', value: 25000, percentage: '16.7', color: CHART_COLORS[3], logo: IPO_LOGOS['Databricks'] },
        ],
        performanceData,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPerformanceData = () => {
    const data = dashboardData.performanceData;
    if (!data.length) return [];

    const monthsMap: Record<string, number> = {
      '1M': 1,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      '3Y': 36,
      '5Y': 60,
      'ALL': data.length,
    };

    const months = monthsMap[performancePeriod];
    return data.slice(-months);
  };

  if (loading || authLoading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-muted rounded-lg"></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg"></div>)}
      </div>
    </div>;
  }

  const { totalInvested, currentValue, unrealisedPL, plPercentage, cashBalances, upcomingCashflows, recentTransactions, assetAllocation, currencyAllocation, ipoAllocation, performanceData } = dashboardData;

  const getPieData = () => {
    switch (pieChartView) {
      case 'asset': return { data: assetAllocation, total: currentValue, title: 'asset' };
      case 'currency': return { data: currencyAllocation, total: currentValue, title: 'currency' };
      case 'ipo': return { data: ipoAllocation, total: ipoAllocation.reduce((sum: number, item: any) => sum + item.value, 0), title: 'ipo' };
      default: return { data: assetAllocation, total: currentValue, title: 'asset' };
    }
  };

  const pieData = getPieData();
  const filteredPerformanceData = getFilteredPerformanceData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Portfolio Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {profile?.name?.split(' ')[0] || 'Investor'}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/portal/add-money">
            <Button size="lg" className="shadow-lg">
              <DollarSign className="mr-2 h-5 w-5" />
              Add Funds
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Total Invested
              </p>
              <p className="text-3xl font-bold">{formatCurrency(totalInvested, client?.base_currency)}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {dashboardData.holdings.length || 4} Active Holdings
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Value
              </p>
              <p className="text-3xl font-bold">{formatCurrency(currentValue, client?.base_currency)}</p>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Growing Steadily
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Unrealised P/L
              </p>
              <p className={`text-3xl font-bold ${unrealisedPL >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {unrealisedPL >= 0 ? '+' : ''}{formatCurrency(unrealisedPL, client?.base_currency)}
              </p>
              <p className={`text-xs flex items-center gap-1 ${unrealisedPL >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {unrealisedPL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercentage(plPercentage)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Cash Available
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(cashBalances.reduce((sum: number, b: any) => sum + b.balance * (b.currency === 'GBP' ? 1.27 : b.currency === 'EUR' ? 1.10 : 1), 0) || 75000, 'USD')}
              </p>
              <p className="text-xs text-muted-foreground">
                {cashBalances.length || 3} {(cashBalances.length || 3) === 1 ? 'Currency' : 'Currencies'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {(cashBalances.length > 0 ? cashBalances : [
          { id: '1', currency: 'USD', balance: 40000 },
          { id: '2', currency: 'GBP', balance: 20000 },
          { id: '3', currency: 'EUR', balance: 15000 },
        ]).map((balance: any) => (
          <Card key={balance.id} className="hover:shadow-lg transition-all group border-2 hover:border-primary/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{balance.currency} Balance</p>
                    <p className="text-2xl font-bold">{formatCurrency(balance.balance, balance.currency)}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {balance.currency}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Portfolio Allocation
                </CardTitle>
                <CardDescription>
                  {pieChartView === 'asset' && 'Distribution by asset class'}
                  {pieChartView === 'currency' && 'Distribution by currency'}
                  {pieChartView === 'ipo' && 'Pre-IPO holdings breakdown'}
                </CardDescription>
              </div>
              <Select value={pieChartView} onValueChange={(v: any) => { setPieChartView(v); setHoveredPieIndex(null); }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset Class</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="ipo">Pre-IPO Holdings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[520px] relative">
            <Interactive3DPie
              data={pieData.data}
              hoveredIndex={hoveredPieIndex}
              setHoveredIndex={setHoveredPieIndex}
              totalValue={pieData.total}
              currency={client?.base_currency}
              showLogos={pieChartView === 'ipo'}
              title={pieData.title}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance History
                </CardTitle>
                <CardDescription>Portfolio value over time</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={performanceChart === 'area' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPerformanceChart('area')}
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant={performanceChart === 'line' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPerformanceChart('line')}
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={performanceChart === 'bar' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPerformanceChart('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              {(['1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'] as const).map((period) => (
                <Button
                  key={period}
                  variant={performancePeriod === period ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setPerformancePeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {performanceChart === 'area' ? (
                <AreaChart data={filteredPerformanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" interval="preserveStartEnd" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-xl p-3 space-y-1">
                            <p className="font-semibold text-sm">{label}</p>
                            <p className="text-primary font-bold">
                              {formatCurrency(payload[0].value as number, client?.base_currency)}
                            </p>
                            {payload[1] && (
                              <p className="text-muted-foreground text-xs">
                                Invested: {formatCurrency(payload[1].value as number, client?.base_currency)}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="invested" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInvested)" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                </AreaChart>
              ) : performanceChart === 'line' ? (
                <LineChart data={filteredPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" interval="preserveStartEnd" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(parseFloat(value), client?.base_currency), 'Portfolio Value']} />
                  <Line type="monotone" dataKey="invested" stroke="#94a3b8" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 6, strokeWidth: 2 }} />
                </LineChart>
              ) : (
                <BarChart data={filteredPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" interval="preserveStartEnd" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(parseFloat(value), client?.base_currency), 'Portfolio Value']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Cashflows
            </CardTitle>
            <CardDescription>Next payments and distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCashflows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming cashflows</p>
              ) : (
                upcomingCashflows.map((cf: any) => (
                  <div key={cf.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cf.holding?.instrument?.issuer_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(cf.date)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-blue-600 border-blue-200 mb-1">
                        {cf.type}
                      </Badge>
                      <p className="text-sm font-semibold">{formatCurrency(parseFloat(cf.expected_amount), cf.currency)}</p>
                    </div>
                  </div>
                ))
              )}
              {upcomingCashflows.length > 0 && (
                <Link href="/portal/calendar">
                  <Button variant="outline" className="w-full mt-2">View All Payments</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent transactions</p>
              ) : (
                recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className={`text-right text-sm font-semibold ${parseFloat(tx.amount) >= 0 ? 'text-blue-600' : 'text-foreground'}`}>
                      {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(Math.abs(parseFloat(tx.amount)), tx.currency)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/portal/holdings" className="block">
          <Card className="group h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Holdings</p>
                    <p className="text-xs text-muted-foreground">View all investments</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/investments" className="block">
          <Card className="group h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <Rocket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Invest</p>
                    <p className="text-xs text-muted-foreground">Explore opportunities</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/documents" className="block">
          <Card className="group h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-sky-500/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Documents</p>
                    <p className="text-xs text-muted-foreground">Statements & reports</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/messages" className="block">
          <Card className="group h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-cyan-500/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                    <Activity className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Messages</p>
                    <p className="text-xs text-muted-foreground">Contact your advisor</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
