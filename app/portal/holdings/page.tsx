'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, Activity, Eye } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatAssetClass, formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';
import { CompanyLogo } from '@/components/ui/company-logo';
import { RiskMeter } from '@/components/ui/risk-meter';
import { HoldingDetailModal } from '@/components/portal/holding-detail-modal';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function HoldingsPage() {
  const { client, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<any[]>([]);
  const [performanceByAsset, setPerformanceByAsset] = useState<any[]>([]);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    if (!authLoading && client) {
      loadHoldings();
    }
  }, [client, authLoading]);

  const loadHoldings = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from('holdings')
        .select('*, instrument:instruments(*)')
        .eq('client_id', client!.id)
        .in('status', ['ACTIVE', 'PENDING_PAYMENT'])
        .order('current_value', { ascending: false });

      const holdingsData = data || [];
      setHoldings(holdingsData);

      const assetClassMap: Record<string, number> = {};
      holdingsData.forEach((h: any) => {
        const assetClass = h.instrument?.asset_class || 'OTHER';
        assetClassMap[assetClass] = (assetClassMap[assetClass] || 0) + parseFloat(h.current_value.toString());
      });

      const totalValue = Object.values(assetClassMap).reduce((sum, val) => sum + val, 0);
      const allocation = Object.entries(assetClassMap).map(([name, value]) => ({
        name: formatAssetClass(name),
        rawName: name,
        value,
        percentage: ((value / totalValue) * 100).toFixed(1),
      }));
      setAssetAllocation(allocation);

      const perfData = holdingsData.map((h: any) => ({
        name: h.instrument?.symbol || h.instrument?.issuer_name?.substring(0, 15) || 'Unknown',
        invested: parseFloat(h.cost_basis),
        current: parseFloat(h.current_value),
        gain: parseFloat(h.unrealised_pl),
      }));
      setPerformanceByAsset(perfData);
    } catch (error) {
      console.error('Error loading holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-muted rounded"></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    </div>;
  }

  const totalInvested = holdings.reduce((sum, h) => sum + parseFloat(h.cost_basis), 0);
  const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.current_value), 0);
  const totalPL = totalValue - totalInvested;
  const totalPLPerc = totalInvested > 0 ? ((totalPL / totalInvested) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Your Holdings</h1>
        <p className="text-muted-foreground mt-1">Detailed breakdown of your investment portfolio</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalInvested, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{holdings.length} active investments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalValue, client?.base_currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Market valuation</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL, client?.base_currency)}
            </div>
            <p className={`text-sm mt-1 font-medium ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatPercentage(totalPLPerc)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Asset Allocation
            </CardTitle>
            <CardDescription>Portfolio distribution by asset class</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(parseFloat(value), client?.base_currency)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance by Holding
                </CardTitle>
                <CardDescription>Compare cost basis vs current value</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setChartType('line')}
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setChartType('area')}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={performanceByAsset}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(parseFloat(value as string), client?.base_currency)} />
                  <Legend />
                  <Bar dataKey="invested" fill="hsl(var(--muted-foreground))" name="Cost Basis" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Value" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={performanceByAsset}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(parseFloat(value as string), client?.base_currency)} />
                  <Legend />
                  <Line type="monotone" dataKey="invested" stroke="hsl(var(--muted-foreground))" name="Cost Basis" strokeWidth={2} />
                  <Line type="monotone" dataKey="current" stroke="hsl(var(--primary))" name="Current Value" strokeWidth={2} />
                </LineChart>
              ) : (
                <AreaChart data={performanceByAsset}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(parseFloat(value as string), client?.base_currency)} />
                  <Legend />
                  <Area type="monotone" dataKey="invested" stroke="hsl(var(--muted-foreground))" fillOpacity={1} fill="url(#colorInvested)" name="Cost Basis" />
                  <Area type="monotone" dataKey="current" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCurrent)" name="Current Value" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Holdings Detail</CardTitle>
          <CardDescription>Complete list of your active investments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({holdings.length})</TabsTrigger>
              <TabsTrigger value="fixed_income">Bonds</TabsTrigger>
              <TabsTrigger value="managed_fund">Managed Funds</TabsTrigger>
              <TabsTrigger value="gold_contract">Gold</TabsTrigger>
            </TabsList>

            {['all', 'fixed_income', 'managed_fund', 'gold_contract'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
                {holdings
                  .filter(h => tab === 'all' || h.instrument?.asset_class?.toLowerCase() === tab)
                  .map((holding: any) => {
                    const pl = parseFloat(holding.unrealised_pl);
                    const plPerc = parseFloat(holding.cost_basis) > 0 ? ((pl / parseFloat(holding.cost_basis)) * 100) : 0;
                    const portfolioPerc = (parseFloat(holding.current_value) / totalValue) * 100;
                    const riskLevel = holding.instrument?.risk_rating || 'MEDIUM';

                    return (
                      <div
                        key={holding.id}
                        className="group p-5 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer bg-card"
                        onClick={() => setSelectedHolding(holding)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <CompanyLogo
                              issuerName={holding.instrument?.issuer_name || 'Unknown'}
                              issuerDomain={holding.instrument?.issuer_domain}
                              symbol={holding.instrument?.symbol}
                              customLogoUrl={holding.instrument?.metadata_json?.company_logo}
                              size="md"
                            />

                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{holding.instrument?.issuer_name}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {holding.instrument?.symbol || formatAssetClass(holding.instrument?.asset_class)}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="secondary">{formatAssetClass(holding.instrument?.asset_class)}</Badge>
                                {(holding.status === 'PENDING' || holding.status === 'PENDING_PAYMENT') && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Awaiting Payment</Badge>
                                )}
                                {holding.status === 'ACTIVE' && <RiskMeter level={riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'} />}
                                <Badge variant="outline">{portfolioPerc.toFixed(1)}% of portfolio</Badge>
                                {holding.maturity_date && (
                                  <Badge variant="outline">Matures {formatDate(holding.maturity_date)}</Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                                  <p className="text-lg font-bold">{formatCurrency(parseFloat(holding.current_value), holding.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Cost Basis</p>
                                  <p className="text-sm font-medium">{formatCurrency(parseFloat(holding.cost_basis), holding.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Gain/Loss</p>
                                  <div className={`flex items-center gap-1 ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {pl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    <span className="text-sm font-semibold">{formatPercentage(plPerc)}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Units/Face</p>
                                  <p className="text-sm font-medium">{parseFloat(holding.face_or_units).toLocaleString('en-GB')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {holdings.filter(h => tab === 'all' || h.instrument?.asset_class?.toLowerCase() === tab).length === 0 && (
                  <p className="text-center text-muted-foreground py-12">No holdings in this category</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <HoldingDetailModal
        holding={selectedHolding}
        isOpen={!!selectedHolding}
        onClose={() => setSelectedHolding(null)}
        portfolioTotal={totalValue}
        baseCurrency={client?.base_currency || 'GBP'}
      />
    </div>
  );
}
