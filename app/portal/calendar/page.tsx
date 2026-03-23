'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, TrendingUp, DollarSign, CalendarDays, Filter } from 'lucide-react';
import { formatCurrency, formatDate, formatAssetClass } from '@/lib/utils/format';
import { CompanyLogo } from '@/components/ui/company-logo';

export default function CalendarPage() {
  const { client, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cashflows, setCashflows] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'COUPON' | 'DIVIDEND' | 'MATURITY'>('all');

  useEffect(() => {
    if (!authLoading && client) {
      loadCashflows();
    }
  }, [client, authLoading]);

  const loadCashflows = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('cashflows')
        .select('*, holding:holdings(*, instrument:instruments(*))')
        .eq('client_id', client!.id)
        .eq('paid', false)
        .order('date', { ascending: true });
      setCashflows(data || []);
    } catch (error) {
      console.error('Error loading cashflows:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="space-y-4 animate-pulse">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
    </div>;
  }

  const filteredCashflows = filterType === 'all'
    ? cashflows
    : cashflows.filter(cf => cf.type === filterType);

  const groupedByMonth = filteredCashflows.reduce((acc, cf) => {
    const month = new Date(cf.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(cf);
    return acc;
  }, {} as Record<string, any[]>);

  const totalExpected = filteredCashflows.reduce((sum, cf) => sum + parseFloat(cf.expected_amount), 0);
  const byType = {
    COUPON: cashflows.filter(cf => cf.type === 'COUPON').reduce((sum, cf) => sum + parseFloat(cf.expected_amount), 0),
    DIVIDEND: cashflows.filter(cf => cf.type === 'DIVIDEND').reduce((sum, cf) => sum + parseFloat(cf.expected_amount), 0),
    MATURITY: cashflows.filter(cf => cf.type === 'MATURITY').reduce((sum, cf) => sum + parseFloat(cf.expected_amount), 0),
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COUPON': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'DIVIDEND': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'MATURITY': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Payment Calendar</h1>
        <p className="text-muted-foreground mt-1">Upcoming coupons, dividends, and distributions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalExpected, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{filteredCashflows.length} payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-1 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(byType.COUPON, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Bond interest</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dividends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(byType.DIVIDEND, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Fund distributions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maturities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(byType.MATURITY, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Principal returns</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Scheduled Payments
              </CardTitle>
              <CardDescription>Your upcoming cashflow schedule</CardDescription>
            </div>
            <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="COUPON">Coupons</TabsTrigger>
                <TabsTrigger value="DIVIDEND">Dividends</TabsTrigger>
                <TabsTrigger value="MATURITY">Maturities</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {Object.keys(groupedByMonth).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming payments scheduled</p>
            </div>
          ) : (
            Object.entries(groupedByMonth).map(([month, cfs]) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold">{month}</h2>
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency((cfs as any[]).reduce((sum, cf) => sum + parseFloat(cf.expected_amount), 0), client?.base_currency)}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {(cfs as any[]).map((cf: any) => {
                    const cfDate = new Date(cf.date);
                    const dayOfWeek = cfDate.toLocaleDateString('en-GB', { weekday: 'short' });
                    const day = cfDate.getDate();

                    return (
                      <Card key={cf.id} className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-4 py-3 min-w-[80px]">
                              <span className="text-xs font-medium text-muted-foreground uppercase">{dayOfWeek}</span>
                              <span className="text-2xl font-bold text-primary">{day}</span>
                            </div>

                            <CompanyLogo
                              issuerName={cf.holding?.instrument?.issuer_name || 'Unknown'}
                              symbol={cf.holding?.instrument?.symbol}
                              customLogoUrl={cf.holding?.instrument?.metadata_json?.company_logo}
                              size="sm"
                            />

                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{cf.holding?.instrument?.issuer_name || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {cf.holding?.instrument?.symbol || formatAssetClass(cf.holding?.instrument?.asset_class)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={getTypeColor(cf.type)}>
                                {cf.type}
                              </Badge>
                              <div className="text-right">
                                <div className="text-xl font-bold text-emerald-600">
                                  {formatCurrency(parseFloat(cf.expected_amount), cf.currency)}
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDate(cf.date)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
