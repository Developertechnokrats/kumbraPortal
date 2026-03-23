'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { formatAssetClass, formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CompanyLogo } from '@/components/ui/company-logo';

interface HoldingDetailModalProps {
  holding: any;
  isOpen: boolean;
  onClose: () => void;
  portfolioTotal: number;
  baseCurrency: string;
}

export function HoldingDetailModal({ holding, isOpen, onClose, portfolioTotal, baseCurrency }: HoldingDetailModalProps) {
  if (!holding) return null;

  const pl = parseFloat(holding.unrealised_pl);
  const plPerc = parseFloat(holding.cost_basis) > 0 ? ((pl / parseFloat(holding.cost_basis)) * 100) : 0;
  const portfolioPerc = (parseFloat(holding.current_value) / portfolioTotal) * 100;

  const performanceData = [
    { month: 'Jul', value: parseFloat(holding.cost_basis) * 0.95 },
    { month: 'Aug', value: parseFloat(holding.cost_basis) * 0.98 },
    { month: 'Sep', value: parseFloat(holding.cost_basis) * 1.01 },
    { month: 'Oct', value: parseFloat(holding.cost_basis) * 1.03 },
    { month: 'Nov', value: parseFloat(holding.cost_basis) * 1.05 },
    { month: 'Dec', value: parseFloat(holding.current_value) },
  ];

  const riskLevel = holding.instrument?.risk_rating || 'MEDIUM';
  const riskColors = {
    LOW: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    MEDIUM: 'text-amber-600 bg-amber-50 border-amber-200',
    HIGH: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <CompanyLogo
              issuerName={holding.instrument?.issuer_name || 'Unknown'}
              issuerDomain={holding.instrument?.issuer_domain}
              customLogoUrl={holding.instrument?.metadata_json?.company_logo}
              size="lg"
              variant="horizontal"
            />
            <div>
              <DialogTitle className="text-2xl">{holding.instrument?.issuer_name}</DialogTitle>
              <DialogDescription>
                {holding.instrument?.symbol} • {formatAssetClass(holding.instrument?.asset_class)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-2xl font-bold">{formatCurrency(parseFloat(holding.current_value), holding.currency)}</div>
                <div className={`text-sm mt-1 ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {pl >= 0 ? '+' : ''}{formatCurrency(pl, holding.currency)} ({formatPercentage(plPerc)})
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">% of Portfolio</div>
                <div className="text-2xl font-bold">{portfolioPerc.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(parseFloat(holding.current_value), holding.currency)} of {formatCurrency(portfolioTotal, baseCurrency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Risk Rating</div>
                <Badge className={`text-base ${riskColors[riskLevel as keyof typeof riskColors]}`}>
                  {riskLevel}
                </Badge>
                <div className="text-sm text-muted-foreground mt-2">Credit risk assessment</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Investment Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cost Basis</p>
                      <p className="text-lg font-semibold">{formatCurrency(parseFloat(holding.cost_basis), holding.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Units/Face Value</p>
                      <p className="text-lg font-semibold">{parseFloat(holding.face_or_units).toLocaleString('en-GB')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Date</p>
                      <p className="text-lg font-semibold">{formatDate(holding.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="text-lg font-semibold">{holding.term_months} months</p>
                    </div>
                    {holding.maturity_date && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Maturity Date</p>
                          <p className="text-lg font-semibold">{formatDate(holding.maturity_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Frequency</p>
                          <p className="text-lg font-semibold">{holding.payment_frequency || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {holding.instrument?.description && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">About this Investment</h3>
                    <p className="text-sm text-muted-foreground">{holding.instrument.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">6-Month Performance</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: any) => [formatCurrency(parseFloat(value), holding.currency), 'Value']} />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Returns</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
                        <span className={`font-semibold ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatPercentage(plPerc)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Annualised Return</span>
                        <span className="font-semibold">{formatPercentage((plPerc / (holding.term_months || 12)) * 12)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Statistics</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Price</span>
                        <span className="font-semibold">
                          {formatCurrency(parseFloat(holding.cost_basis) / parseFloat(holding.face_or_units), holding.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Price</span>
                        <span className="font-semibold">
                          {formatCurrency(parseFloat(holding.current_value) / parseFloat(holding.face_or_units), holding.currency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Investment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Instrument Type</span>
                      <span className="font-medium">{formatAssetClass(holding.instrument?.asset_class)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">{holding.currency}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200">{holding.status}</Badge>
                    </div>
                    {holding.instrument?.issuer && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Issuer</span>
                        <span className="font-medium">{holding.instrument.issuer}</span>
                      </div>
                    )}
                    {holding.instrument?.coupon_rate && (
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Coupon Rate</span>
                        <span className="font-medium">{holding.instrument.coupon_rate}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
