'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle, Repeat, TrendingDown, TrendingUp, Receipt, Filter, RefreshCw, Wallet, ChevronRight, PiggyBank, BarChart3, Calendar, Percent, DollarSign, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface CashLedgerEntry {
  id: string;
  transaction_type: string;
  currency: string;
  amount: number;
  running_balance: number;
  status: string;
  reference: string | null;
  notes: string | null;
  fx_rate: number | null;
  fx_currency_from: string | null;
  fx_currency_to: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_reason: string | null;
}

interface CashAccount {
  id: string;
  currency: string;
  balance: number;
}

interface CashLedgerViewProps {
  clientId: string;
  isAdmin?: boolean;
}

const CHART_COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#0891b2', '#2563eb', '#1d4ed8'];

export function CashLedgerView({ clientId, isAdmin = false }: CashLedgerViewProps) {
  const [ledger, setLedger] = useState<CashLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerResponse, accountsResponse] = await Promise.all([
        (supabase as any)
          .from('cash_ledger')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('client_cash_accounts')
          .select('*')
          .eq('client_id', clientId)
          .order('currency'),
      ]);

      if (ledgerResponse.error) throw ledgerResponse.error;
      if (accountsResponse.error) throw accountsResponse.error;

      setLedger(ledgerResponse.data || []);
      setAccounts(accountsResponse.data || []);
    } catch (error) {
      console.error('Error loading cash ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const approvedLedger = ledger.filter(e => e.status === 'APPROVED');

    const totalDeposits: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    const totalWithdrawals: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    const totalInterest: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    const totalRealisedProfits: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);
    const oneYearAgo = subDays(now, 365);

    const withdrawals30d: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    const withdrawals90d: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    const withdrawals1y: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };

    approvedLedger.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      const currency = entry.currency as keyof typeof totalDeposits;

      if (entry.transaction_type === 'DEPOSIT' && entry.amount > 0) {
        totalDeposits[currency] = (totalDeposits[currency] || 0) + entry.amount;
      }

      if (entry.transaction_type === 'WITHDRAWAL' && entry.amount < 0) {
        const absAmount = Math.abs(entry.amount);
        totalWithdrawals[currency] = (totalWithdrawals[currency] || 0) + absAmount;

        if (entryDate >= thirtyDaysAgo) withdrawals30d[currency] = (withdrawals30d[currency] || 0) + absAmount;
        if (entryDate >= ninetyDaysAgo) withdrawals90d[currency] = (withdrawals90d[currency] || 0) + absAmount;
        if (entryDate >= oneYearAgo) withdrawals1y[currency] = (withdrawals1y[currency] || 0) + absAmount;
      }

      if (entry.transaction_type === 'INTEREST' && entry.amount > 0) {
        totalInterest[currency] = (totalInterest[currency] || 0) + entry.amount;
      }

      if (entry.transaction_type === 'CAPITAL_RETURN' && entry.amount > 0) {
        totalRealisedProfits[currency] = (totalRealisedProfits[currency] || 0) + entry.amount;
      }
    });

    const monthlyData: Record<string, { deposits: number; withdrawals: number; interest: number }> = {};
    approvedLedger.forEach(entry => {
      const monthKey = format(new Date(entry.created_at), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { deposits: 0, withdrawals: 0, interest: 0 };
      }

      if (entry.transaction_type === 'DEPOSIT' && entry.amount > 0) {
        monthlyData[monthKey].deposits += entry.amount;
      }
      if (entry.transaction_type === 'WITHDRAWAL' && entry.amount < 0) {
        monthlyData[monthKey].withdrawals += Math.abs(entry.amount);
      }
      if (entry.transaction_type === 'INTEREST' && entry.amount > 0) {
        monthlyData[monthKey].interest += entry.amount;
      }
    });

    const chartData = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .reverse()
      .slice(-6);

    const typeBreakdown = approvedLedger.reduce((acc, entry) => {
      const type = entry.transaction_type;
      if (!acc[type]) acc[type] = 0;
      acc[type] += Math.abs(entry.amount);
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(typeBreakdown).map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      value,
    }));

    return {
      totalDeposits,
      totalWithdrawals,
      totalInterest,
      totalRealisedProfits,
      withdrawals30d,
      withdrawals90d,
      withdrawals1y,
      chartData,
      pieData,
    };
  }, [ledger]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'FX_CONVERSION':
        return <Repeat className="h-4 w-4 text-blue-600" />;
      case 'INTEREST':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'CAPITAL_RETURN':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'INVESTMENT_FUNDING':
        return <Receipt className="h-4 w-4 text-purple-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTimeFilteredLedger = () => {
    if (timeRange === 'all') return ledger;

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        return ledger;
    }

    return ledger.filter(entry => new Date(entry.created_at) >= startDate);
  };

  const filteredLedger = getTimeFilteredLedger().filter(entry => {
    if (selectedCurrency !== 'ALL' && entry.currency !== selectedCurrency) return false;
    if (filterType !== 'ALL' && entry.transaction_type !== filterType) return false;
    if (filterStatus !== 'ALL' && entry.status !== filterStatus) return false;
    return true;
  });

  const getAccountLedger = (currency: string) => {
    return ledger
      .filter(entry => entry.currency === currency && entry.status === 'APPROVED')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.currency === 'GBP') return sum + acc.balance * 1.27;
    if (acc.currency === 'EUR') return sum + acc.balance * 1.10;
    return sum + acc.balance;
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Total Cash Balance (USD Equivalent)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{formatCurrency(totalBalance, 'USD')}</div>
          <p className="text-sm text-muted-foreground mt-1">Across all currency accounts</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="gbp">GBP</TabsTrigger>
          <TabsTrigger value="usd">USD</TabsTrigger>
          <TabsTrigger value="eur">EUR</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {accounts.map(account => (
              <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer group border-2 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <CardDescription className="text-sm font-medium">
                        {account.currency} Account
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(account.balance, account.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>Complete cash movement history</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Currencies</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="DEPOSIT">Deposits</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                    <SelectItem value="INVESTMENT_FUNDING">Investments</SelectItem>
                    <SelectItem value="INTEREST">Interest</SelectItem>
                    <SelectItem value="CAPITAL_RETURN">Capital Returns</SelectItem>
                    <SelectItem value="FX_CONVERSION">FX Conversions</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="APPROVED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLedger.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No transactions found</p>
                  {(selectedCurrency !== 'ALL' || filterType !== 'ALL' || filterStatus !== 'ALL') && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => {
                        setSelectedCurrency('ALL');
                        setFilterType('ALL');
                        setFilterStatus('ALL');
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(entry.created_at), 'dd MMM yyyy')}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(entry.transaction_type)}
                              <div>
                                <span className="text-sm font-medium">{getTransactionLabel(entry.transaction_type)}</span>
                                {(entry.reference || entry.notes) && (
                                  <div className="text-xs text-muted-foreground truncate max-w-48">
                                    {entry.transaction_type === 'FX_CONVERSION' && entry.fx_rate ? (
                                      <span>{entry.fx_currency_from} to {entry.fx_currency_to} @ {entry.fx_rate.toFixed(4)}</span>
                                    ) : (
                                      entry.reference || entry.notes
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.currency}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.amount < 0 ? (
                              <span className="font-semibold text-red-600">
                                {formatCurrency(Math.abs(entry.amount), entry.currency)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.amount >= 0 ? (
                              <span className="font-semibold text-green-600">
                                {formatCurrency(entry.amount, entry.currency)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.status === 'APPROVED' ? formatCurrency(entry.running_balance, entry.currency) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-blue-600" />
                  Total Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.totalDeposits).map(([currency, amount]) => (
                    amount > 0 && (
                      <div key={currency} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{currency}</Badge>
                        <span className="font-semibold text-blue-600">{formatCurrency(amount, currency)}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-sky-600" />
                  Total Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.totalWithdrawals).map(([currency, amount]) => (
                    amount > 0 && (
                      <div key={currency} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{currency}</Badge>
                        <span className="font-semibold text-sky-600">{formatCurrency(amount, currency)}</span>
                      </div>
                    )
                  ))}
                  {Object.values(stats.totalWithdrawals).every(v => v === 0) && (
                    <p className="text-sm text-muted-foreground">No withdrawals</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4 text-cyan-600" />
                  Total Interest Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.totalInterest).map(([currency, amount]) => (
                    amount > 0 && (
                      <div key={currency} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{currency}</Badge>
                        <span className="font-semibold text-cyan-600">{formatCurrency(amount, currency)}</span>
                      </div>
                    )
                  ))}
                  {Object.values(stats.totalInterest).every(v => v === 0) && (
                    <p className="text-sm text-muted-foreground">No interest yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  Realised Profits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.totalRealisedProfits).map(([currency, amount]) => (
                    amount > 0 && (
                      <div key={currency} className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">{currency}</Badge>
                        <span className="font-semibold text-teal-600">{formatCurrency(amount, currency)}</span>
                      </div>
                    )
                  ))}
                  {Object.values(stats.totalRealisedProfits).every(v => v === 0) && (
                    <p className="text-sm text-muted-foreground">No realised profits yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Monthly Cash Flow
                </CardTitle>
                <CardDescription>Deposits, withdrawals and interest over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {stats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="deposits" name="Deposits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="withdrawals" name="Withdrawals" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="interest" name="Interest" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  Transaction Breakdown
                </CardTitle>
                <CardDescription>Distribution by transaction type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {stats.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {stats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatCurrency(value, 'USD')}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Withdrawals by Time Period
              </CardTitle>
              <CardDescription>Compare withdrawal activity across different timeframes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Last 30 Days</p>
                  {Object.entries(stats.withdrawals30d).map(([currency, amount]) => (
                    <div key={currency} className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">{currency}</Badge>
                      <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Last 90 Days</p>
                  {Object.entries(stats.withdrawals90d).map(([currency, amount]) => (
                    <div key={currency} className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">{currency}</Badge>
                      <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground mb-2">Last 12 Months</p>
                  {Object.entries(stats.withdrawals1y).map(([currency, amount]) => (
                    <div key={currency} className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">{currency}</Badge>
                      <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['gbp', 'usd', 'eur'].map(currency => {
          const currencyUpper = currency.toUpperCase();
          const account = accounts.find(a => a.currency === currencyUpper);
          const accountLedger = getAccountLedger(currencyUpper);

          return (
            <TabsContent key={currency} value={currency} className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    {currencyUpper} Account Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {formatCurrency(account?.balance || 0, currencyUpper)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Available for withdrawal or investment</p>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposited</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(stats.totalDeposits[currencyUpper as keyof typeof stats.totalDeposits] || 0, currencyUpper)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-sky-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-sky-600">
                      {formatCurrency(stats.totalWithdrawals[currencyUpper as keyof typeof stats.totalWithdrawals] || 0, currencyUpper)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Interest Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-600">
                      {formatCurrency(stats.totalInterest[currencyUpper as keyof typeof stats.totalInterest] || 0, currencyUpper)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{currencyUpper} Transaction History</CardTitle>
                  <CardDescription>Statement of all {currencyUpper} account movements</CardDescription>
                </CardHeader>
                <CardContent>
                  {accountLedger.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No transactions in this account</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountLedger.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {format(new Date(entry.created_at), 'dd MMM yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon(entry.transaction_type)}
                                  <div>
                                    <span className="text-sm font-medium">{getTransactionLabel(entry.transaction_type)}</span>
                                    {(entry.reference || entry.notes) && (
                                      <div className="text-xs text-muted-foreground truncate max-w-64">
                                        {entry.transaction_type === 'FX_CONVERSION' && entry.fx_rate ? (
                                          <span>{entry.fx_currency_from} to {entry.fx_currency_to} @ {entry.fx_rate.toFixed(4)}</span>
                                        ) : (
                                          entry.reference || entry.notes
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.amount < 0 ? (
                                  <span className="font-semibold text-red-600">
                                    {formatCurrency(Math.abs(entry.amount), entry.currency)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.amount >= 0 ? (
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(entry.amount, entry.currency)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(entry.running_balance, entry.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
