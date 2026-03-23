'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAUM: 0,
    totalClients: 0,
    averageClientValue: 0,
    monthlyRevenue: 0
  });
  const [assetAllocation, setAssetAllocation] = useState<any[]>([]);
  const [clientGrowth, setClientGrowth] = useState<any[]>([]);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [clientsRes, holdingsRes, transactionsRes] = await Promise.all([
        supabase.from('clients').select('id, created_at'),
        supabase.from('holdings').select('current_value, status, instrument:instruments!inner(asset_class)'),
        supabase.from('transactions').select('amount, transaction_type, created_at, currency')
      ]);

      const clients = clientsRes.data || [];
      const holdings = (holdingsRes.data || []).filter((h: any) => h.status === 'ACTIVE');
      const transactions = transactionsRes.data || [];

      const totalAUM = holdings.reduce((sum: number, h: any) => sum + Number(h.current_value), 0);
      const avgClientValue = clients.length > 0 ? totalAUM / clients.length : 0;

      const thisMonth = new Date().getMonth();
      const monthlyRevenue = transactions
        .filter((t: any) => new Date(t.created_at).getMonth() === thisMonth && t.transaction_type === 'FEE')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      setStats({
        totalAUM,
        totalClients: clients.length,
        averageClientValue: avgClientValue,
        monthlyRevenue
      });

      const assetBreakdown: any = {};
      holdings.forEach((h: any) => {
        const assetClass = h.instrument.asset_class;
        assetBreakdown[assetClass] = (assetBreakdown[assetClass] || 0) + h.current_value;
      });

      setAssetAllocation(
        Object.entries(assetBreakdown).map(([name, value]) => ({
          name,
          value: Number(value)
        }))
      );

      const monthlyClients: any = {};
      clients.forEach((c: any) => {
        const month = new Date(c.created_at).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
        monthlyClients[month] = (monthlyClients[month] || 0) + 1;
      });

      setClientGrowth(
        Object.entries(monthlyClients).map(([month, count]) => ({
          month,
          clients: count
        })).slice(-6)
      );

      const revByType: any = {};
      transactions.forEach((t: any) => {
        if (t.amount > 0) {
          revByType[t.transaction_type] = (revByType[t.transaction_type] || 0) + Number(t.amount);
        }
      });

      setRevenueByType(
        Object.entries(revByType).map(([type, amount]) => ({
          type,
          amount: Number(amount)
        }))
      );

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Statistics</h1>
        <p className="text-muted-foreground mt-1">Executive dashboard and analytics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalAUM, 'GBP')}</div>
            <p className="text-xs text-muted-foreground mt-1">Assets Under Management</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active client accounts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Client Value</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.averageClientValue, 'GBP')}</div>
            <p className="text-xs text-muted-foreground mt-1">Per client portfolio</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Activity className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(Math.abs(stats.monthlyRevenue), 'GBP')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month's fees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value, 'GBP')} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Client Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value, 'GBP')} />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
