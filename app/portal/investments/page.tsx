'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Landmark, TrendingUp, Coins, ChevronRight, Loader as Loader2, Rocket, ArrowLeft, Info, Phone, Building2, Globe, Users, Calendar, DollarSign, Shield, ChartBar as BarChart3, Clock, Percent, ExternalLink, Target, Award } from 'lucide-react';
import { CompanyLogo } from '@/components/ui/company-logo';
import { RiskMeter } from '@/components/ui/risk-meter';
import { formatCurrency } from '@/lib/utils/format';
import { Slider } from '@/components/ui/slider';
import { NewsFeed } from '@/components/portal/news-feed';
import { BondInvestmentModal } from '@/components/portal/bond-investment-modal';
import { PreIPOInvestmentModal } from '@/components/portal/preipo-investment-modal';
import { preIPONewsItems } from '@/lib/data/preipo-news';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

type ViewType = 'landing' | 'bonds' | 'funds' | 'gold' | 'preipo';

export default function InvestmentsPage() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [bonds, setBonds] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [goldContracts, setGoldContracts] = useState<any[]>([]);
  const [preIPOs, setPreIPOs] = useState<any[]>([]);
  const [bondFilters, setBondFilters] = useState({
    currency: 'all',
    minCoupon: 0,
    maxCoupon: 10,
    minInvestment: 1000000,
    paymentFrequency: 'all',
    term: 'all'
  });
  const [selectedBond, setSelectedBond] = useState<any>(null);
  const [selectedPreIPO, setSelectedPreIPO] = useState<any>(null);
  const [selectedFund, setSelectedFund] = useState<any>(null);

  useEffect(() => {
    loadClientAndInstruments();
  }, []);

  const loadClientAndInstruments = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: client } = await (supabase as any)
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (client) setClientId(client.id);

      const { data } = await supabase
        .from('instruments')
        .select('*')
        .eq('is_active', true)
        .order('issuer_name');

      const instrumentsData = data || [];
      setBonds(instrumentsData.filter((i: any) => i.asset_class === 'FIXED_INCOME'));
      setFunds(instrumentsData.filter((i: any) => i.asset_class === 'MANAGED_FUND'));
      setGoldContracts(instrumentsData.filter((i: any) => i.asset_class === 'GOLD_CONTRACT'));
      setPreIPOs(instrumentsData.filter((i: any) => i.asset_class === 'PRE_IPO'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCall = async (instrumentName: string, assetClass: string) => {
    if (!clientId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const message = {
        client_id: clientId,
        subject: `Investment Inquiry: ${instrumentName}`,
        message: `I would like to discuss investing in ${instrumentName} (${assetClass}). Please contact me to discuss this opportunity.`,
        direction: 'CLIENT_TO_ADMIN',
        status: 'UNREAD',
        sender_id: user.id,
      };

      const { error } = await (supabase as any)
        .from('messages')
        .insert(message);

      if (error) throw error;

      toast({
        title: 'Call Request Sent',
        description: 'Your account manager will contact you shortly.',
      });
    } catch (error: any) {
      console.error('Error requesting call:', error);
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to send call request',
        variant: 'destructive',
      });
    }
  };

  const filteredBonds = bonds.filter(bond => {
    if (bondFilters.currency !== 'all' && bond.currency !== bondFilters.currency) return false;
    const couponRate = bond.metadata_json?.coupon_rate || 0;
    if (couponRate < bondFilters.minCoupon || couponRate > bondFilters.maxCoupon) return false;
    const minInv = bond.metadata_json?.min_investment || 10000;
    if (minInv > bondFilters.minInvestment) return false;
    return true;
  });

  const getRiskLevel = (metadata: any): 'LOW' | 'MEDIUM' | 'HIGH' => {
    const rating = metadata?.rating;
    if (!rating) return 'MEDIUM';
    const highGrade = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-'];
    const mediumGrade = ['BBB+', 'BBB', 'BBB-', 'BB+', 'BB'];
    if (highGrade.includes(rating)) return 'LOW';
    if (mediumGrade.includes(rating)) return 'MEDIUM';
    return 'HIGH';
  };

  const formatValuation = (val: number) => {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderModals = () => (
    <>
      {clientId && selectedBond && (
        <BondInvestmentModal
          bond={selectedBond}
          clientId={clientId}
          open={!!selectedBond}
          onClose={() => setSelectedBond(null)}
        />
      )}

      {clientId && selectedPreIPO && (
        <PreIPOInvestmentModal
          preipo={selectedPreIPO}
          clientId={clientId}
          open={!!selectedPreIPO}
          onClose={() => setSelectedPreIPO(null)}
        />
      )}

      <Dialog open={!!selectedFund} onOpenChange={() => setSelectedFund(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFund && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center overflow-hidden">
                    {selectedFund.metadata_json?.company_logo ? (
                      <Image
                        src={selectedFund.metadata_json.company_logo}
                        alt={selectedFund.issuer_name}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <BarChart3 className="h-8 w-8 text-cyan-600" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedFund.issuer_name}</DialogTitle>
                    <DialogDescription>{selectedFund.metadata_json?.strategy || selectedFund.metadata_json?.fund_type}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {selectedFund.metadata_json?.description && (
                  <p className="text-muted-foreground">{selectedFund.metadata_json.description}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Currency</p>
                    <p className="font-semibold text-lg">{selectedFund.currency}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Minimum Investment</p>
                    <p className="font-semibold text-lg">{formatCurrency(selectedFund.metadata_json?.min_investment, selectedFund.currency)}</p>
                  </div>
                  {selectedFund.metadata_json?.management_fee && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Management Fee</p>
                      <p className="font-semibold text-lg">{selectedFund.metadata_json.management_fee}% p.a.</p>
                    </div>
                  )}
                  {selectedFund.metadata_json?.distribution_policy && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Distribution Policy</p>
                      <p className="font-semibold text-lg">{selectedFund.metadata_json.distribution_policy}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRequestCall(selectedFund.issuer_name, selectedFund.asset_class)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Request Call
                  </Button>
                  <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Express Interest
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  if (currentView === 'landing') {
    return (
      <>
        {renderModals()}
        <div className="space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-3">Investment Opportunities</h1>
            <p className="text-lg text-muted-foreground">
              Access exclusive investment opportunities carefully curated for our clients
            </p>
          </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500/50 overflow-hidden relative"
            onClick={() => setCurrentView('bonds')}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                  <Landmark className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Fixed Income</h2>
                  <p className="text-sm text-muted-foreground">{bonds.length} Bonds Available</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Investment-grade corporate and government bonds with predictable returns and capital preservation.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-blue-500/10 rounded-full">
                    <Percent className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span>Yields from 3.5% to 7.5% p.a.</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-blue-500/10 rounded-full">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span>Investment grade rated (AAA to BBB)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-blue-500/10 rounded-full">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span>Quarterly & semi-annual payments</span>
                </div>
              </div>
              <Button className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors" variant="outline" size="lg">
                Explore Bonds
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-emerald-500/50 overflow-hidden relative"
            onClick={() => setCurrentView('preipo')}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">High Growth</Badge>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                  <Rocket className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Pre-IPO</h2>
                  <p className="text-sm text-muted-foreground">{preIPOs.length} Companies Available</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Exclusive early access to high-growth private companies before they go public.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-emerald-500/10 rounded-full">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>Companies valued $7B to $180B+</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-emerald-500/10 rounded-full">
                    <Target className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>Tech, fintech & innovation sectors</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-emerald-500/10 rounded-full">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span>IPOs expected 2025-2026</span>
                </div>
              </div>
              <Button className="w-full group-hover:bg-emerald-600 group-hover:text-white transition-colors" variant="outline" size="lg">
                Explore Pre-IPO
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-cyan-500/50 overflow-hidden relative"
            onClick={() => setCurrentView('funds')}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-cyan-500/10 rounded-2xl group-hover:bg-cyan-500/20 transition-colors">
                  <BarChart3 className="h-8 w-8 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Managed Funds</h2>
                  <p className="text-sm text-muted-foreground">{funds.length} Funds Available</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Professionally managed portfolios designed to achieve specific investment objectives.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-cyan-500/10 rounded-full">
                    <Users className="h-3.5 w-3.5 text-cyan-600" />
                  </div>
                  <span>Expert portfolio management</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-cyan-500/10 rounded-full">
                    <Shield className="h-3.5 w-3.5 text-cyan-600" />
                  </div>
                  <span>Diversified asset allocation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-cyan-500/10 rounded-full">
                    <Award className="h-3.5 w-3.5 text-cyan-600" />
                  </div>
                  <span>Multiple strategy options</span>
                </div>
              </div>
              <Button className="w-full group-hover:bg-cyan-600 group-hover:text-white transition-colors" variant="outline" size="lg">
                Explore Funds
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>

          <Card className="group cursor-not-allowed opacity-60 overflow-hidden relative border-2">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-amber-500 text-white">Coming Soon</Badge>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-amber-500/10 rounded-2xl">
                  <Coins className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Gold Contracts</h2>
                  <p className="text-sm text-muted-foreground">Available Soon</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Physical gold contracts for portfolio hedging and wealth preservation.
              </p>
              <div className="space-y-3 mb-6 text-muted-foreground">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-amber-500/10 rounded-full">
                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span>Inflation protection</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-amber-500/10 rounded-full">
                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span>Secure vault storage</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-amber-500/10 rounded-full">
                    <Globe className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span>Physical gold backing</span>
                </div>
              </div>
              <Button className="w-full" variant="outline" size="lg" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>
        </div>
        </div>
      </>
    );
  }

  if (currentView === 'bonds') {
    return (
      <>
        {renderModals()}
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView('landing')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fixed Income Bonds</h1>
              <p className="text-muted-foreground">Investment-grade corporate and government bonds</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {filteredBonds.length} of {bonds.length} bonds
          </Badge>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Select value={bondFilters.currency} onValueChange={(v) => setBondFilters({...bondFilters, currency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Investment</label>
                <Select
                  value={bondFilters.minInvestment.toString()}
                  onValueChange={(v) => setBondFilters({...bondFilters, minInvestment: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">Up to 10,000</SelectItem>
                    <SelectItem value="25000">Up to 25,000</SelectItem>
                    <SelectItem value="50000">Up to 50,000</SelectItem>
                    <SelectItem value="100000">Up to 100,000</SelectItem>
                    <SelectItem value="500000">Up to 500,000</SelectItem>
                    <SelectItem value="1000000">Any Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 col-span-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Coupon Rate Range</label>
                  <span className="text-sm text-muted-foreground">
                    {bondFilters.minCoupon}% - {bondFilters.maxCoupon}%
                  </span>
                </div>
                <Slider
                  value={[bondFilters.minCoupon, bondFilters.maxCoupon]}
                  onValueChange={(v) => setBondFilters({...bondFilters, minCoupon: v[0], maxCoupon: v[1]})}
                  min={0}
                  max={10}
                  step={0.25}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBonds.map((bond) => (
            <Card
              key={bond.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500/50 overflow-hidden"
              onClick={() => setSelectedBond(bond)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center overflow-hidden shrink-0">
                    {bond.metadata_json?.company_logo ? (
                      <Image
                        src={bond.metadata_json.company_logo}
                        alt={bond.issuer_name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      <Landmark className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{bond.issuer_name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{bond.metadata_json?.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Coupon Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{bond.metadata_json?.coupon_rate}%</p>
                    <p className="text-xs text-muted-foreground">per annum</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Credit Rating</p>
                    <p className="text-2xl font-bold">{bond.metadata_json?.rating || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">grade</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <Badge variant="secondary">{bond.currency}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Investment</span>
                    <span className="font-medium">{formatCurrency(bond.metadata_json?.min_investment || 50000, bond.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium">{bond.metadata_json?.payment_frequency || 'Quarterly'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <RiskMeter level={getRiskLevel(bond.metadata_json)} />
                </div>

                <Button className="w-full mt-4 group-hover:bg-blue-600 group-hover:text-white transition-colors" variant="outline">
                  View Details
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredBonds.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <Landmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">No bonds match your criteria</p>
              <p className="text-muted-foreground">Try adjusting your filters to see more options</p>
            </CardContent>
          </Card>
        )}
        </div>
      </>
    );
  }

  if (currentView === 'preipo') {
    return (
      <>
        {renderModals()}
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView('landing')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pre-IPO Investments</h1>
              <p className="text-muted-foreground">Early access to high-growth private companies</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 rounded-xl shrink-0">
                <Info className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">About Pre-IPO Investments</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-IPO investments offer the opportunity to invest in late-stage private companies before they go public.
                  These investments carry higher risk but offer substantial upside potential. All investments are subject to lock-up periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-2">
              {preIPOs.map((preipo) => (
                <Card
                  key={preipo.id}
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-emerald-500/50 overflow-hidden flex flex-col"
                  onClick={() => setSelectedPreIPO(preipo)}
                >
                  <div className="h-32 bg-white dark:bg-slate-100 flex items-center justify-center p-6 border-b">
                    {preipo.metadata_json?.company_logo ? (
                      <Image
                        src={preipo.metadata_json.company_logo}
                        alt={preipo.issuer_name}
                        width={200}
                        height={80}
                        className="object-contain max-h-20 w-auto"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-emerald-600" />
                      </div>
                    )}
                  </div>

                  <CardContent className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{preipo.issuer_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{preipo.metadata_json?.sector}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-xs shrink-0">
                        IPO {preipo.metadata_json?.expected_ipo || 'TBD'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {preipo.metadata_json?.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-muted-foreground">Valuation</p>
                        <p className="font-bold text-emerald-600">{formatValuation(preipo.metadata_json?.valuation || 0)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-muted-foreground">Share Price</p>
                        <p className="font-bold">${preipo.metadata_json?.price_per_share || preipo.metadata_json?.share_price}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span className="text-muted-foreground">Min: {formatCurrency(preipo.metadata_json?.min_investment || preipo.metadata_json?.minimum_investment, preipo.currency)}</span>
                      <span className="text-muted-foreground">Founded {preipo.metadata_json?.founded || 'N/A'}</span>
                    </div>
                  </CardContent>

                  <div className="px-5 pb-5">
                    <Button className="w-full group-hover:bg-emerald-600 group-hover:text-white transition-colors" variant="outline">
                      View Company
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <NewsFeed newsItems={preIPONewsItems} />
          </div>
        </div>
        </div>
      </>
    );
  }

  if (currentView === 'funds') {
    return (
      <>
        {renderModals()}
        <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView('landing')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Managed Funds</h1>
            <p className="text-muted-foreground">Professionally managed investment portfolios</p>
          </div>
        </div>

        <div className="grid gap-4">
          {funds.map((fund) => (
            <Card
              key={fund.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-cyan-500/50 overflow-hidden"
              onClick={() => setSelectedFund(fund)}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 p-6 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-b md:border-b-0 md:border-r">
                    {fund.metadata_json?.company_logo ? (
                      <Image
                        src={fund.metadata_json.company_logo}
                        alt={fund.issuer_name}
                        width={120}
                        height={60}
                        className="object-contain max-h-16"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                        <BarChart3 className="h-10 w-10 text-cyan-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{fund.issuer_name}</h3>
                        <p className="text-sm text-muted-foreground">{fund.metadata_json?.strategy || fund.metadata_json?.fund_type}</p>
                      </div>
                      <div className="flex gap-2">
                        {fund.symbol && <Badge variant="outline">{fund.symbol}</Badge>}
                        {fund.metadata_json?.management_fee && (
                          <Badge variant="secondary">{fund.metadata_json.management_fee}% Fee</Badge>
                        )}
                      </div>
                    </div>

                    {fund.metadata_json?.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {fund.metadata_json.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Currency</p>
                        <p className="font-bold text-lg">{fund.currency}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Min Investment</p>
                        <p className="font-bold text-lg">{formatCurrency(fund.metadata_json?.min_investment, fund.currency)}</p>
                      </div>
                      {fund.metadata_json?.inception_date && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Inception</p>
                          <p className="font-bold text-lg">{new Date(fund.metadata_json.inception_date).getFullYear()}</p>
                        </div>
                      )}
                      {fund.metadata_json?.distribution_policy && (
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Distributions</p>
                          <p className="font-bold text-lg text-sm">{fund.metadata_json.distribution_policy}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <Button className="group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        View Fund Details
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {funds.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">No funds available</p>
              <p className="text-muted-foreground">Check back soon for new fund opportunities</p>
            </CardContent>
          </Card>
        )}
        </div>
      </>
    );
  }

  return null;
}
