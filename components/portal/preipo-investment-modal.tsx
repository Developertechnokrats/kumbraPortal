'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Phone, Wallet, TrendingUp, Calendar, Info, Rocket, Building2, Users, Globe, DollarSign, Clock, Target, LineChart, Newspaper, ExternalLink, CheckCircle, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface PreIPOInvestmentModalProps {
  preipo: any;
  clientId: string;
  open: boolean;
  onClose: () => void;
}

const COMPANY_DATA: Record<string, {
  fundingRounds: { date: string; round: string; amount: string; valuation: string; leadInvestors: string }[];
  news: { date: string; headline: string; source: string }[];
  keyMetrics: { metric: string; value: string }[];
  description: string;
}> = {
  'SPACEX': {
    fundingRounds: [
      { date: 'Dec 2024', round: 'Series N', amount: '$1.25B', valuation: '$350B', leadInvestors: 'Various Institutional' },
      { date: 'Jun 2024', round: 'Series M', amount: '$750M', valuation: '$210B', leadInvestors: 'Andreessen Horowitz' },
      { date: 'Dec 2023', round: 'Series L', amount: '$750M', valuation: '$180B', leadInvestors: 'Founders Fund' },
      { date: 'May 2022', round: 'Series K', amount: '$1.68B', valuation: '$127B', leadInvestors: 'Sequoia Capital' },
      { date: 'Feb 2021', round: 'Series J', amount: '$850M', valuation: '$74B', leadInvestors: 'Fidelity' },
    ],
    news: [
      { date: '15 Dec 2024', headline: 'SpaceX successfully completes 6th Starship test flight with booster catch', source: 'Reuters' },
      { date: '10 Dec 2024', headline: 'Starlink reaches 4 million active subscribers globally', source: 'Bloomberg' },
      { date: '28 Nov 2024', headline: 'SpaceX signs major contract with NASA for Artemis lunar missions', source: 'Space News' },
      { date: '15 Nov 2024', headline: 'Company valued at $350B in latest secondary share sales', source: 'WSJ' },
    ],
    keyMetrics: [
      { metric: 'Starlink Subscribers', value: '4M+' },
      { metric: 'Launches in 2024', value: '144' },
      { metric: 'Satellites in Orbit', value: '6,500+' },
      { metric: 'Annual Revenue Est.', value: '$13B' },
    ],
    description: 'SpaceX designs, manufactures, and launches advanced rockets and spacecraft. The company was founded to revolutionize space technology, with the ultimate goal of enabling human life on Mars. SpaceX\'s Starlink satellite internet constellation is the world\'s largest, providing high-speed internet to underserved areas globally.',
  },
  'STRIPE': {
    fundingRounds: [
      { date: 'Mar 2024', round: 'Series J', amount: '$694M', valuation: '$70B', leadInvestors: 'Sequoia, a]6z' },
      { date: 'Mar 2023', round: 'Series I', amount: '$6.5B', valuation: '$50B', leadInvestors: 'a16z, Thrive' },
      { date: 'Mar 2021', round: 'Series H', amount: '$600M', valuation: '$95B', leadInvestors: 'Sequoia' },
      { date: 'Apr 2020', round: 'Series G', amount: '$600M', valuation: '$36B', leadInvestors: 'General Catalyst' },
    ],
    news: [
      { date: '12 Dec 2024', headline: 'Stripe processes record $1 trillion in payments for 2024', source: 'TechCrunch' },
      { date: '5 Dec 2024', headline: 'Company launches Stripe Capital expansion to 15 new markets', source: 'Fintech Times' },
      { date: '20 Nov 2024', headline: 'Stripe valued at $70B following latest funding round', source: 'Bloomberg' },
      { date: '8 Nov 2024', headline: 'New AI-powered fraud detection reduces chargebacks by 40%', source: 'WSJ' },
    ],
    keyMetrics: [
      { metric: 'Payment Volume', value: '$1T+' },
      { metric: 'Businesses Served', value: '3M+' },
      { metric: 'Countries', value: '46' },
      { metric: 'Annual Revenue Est.', value: '$16B' },
    ],
    description: 'Stripe is a financial infrastructure platform for the internet. Millions of companies from startups to Fortune 500s use Stripe to accept payments, grow their revenue, and accelerate new business opportunities. Stripe\'s software powers payments for online retailers, subscription services, and marketplaces.',
  },
  'DATABRICKS': {
    fundingRounds: [
      { date: 'Sep 2024', round: 'Series J', amount: '$500M', valuation: '$62B', leadInvestors: 'Thrive Capital' },
      { date: 'Sep 2023', round: 'Series I', amount: '$500M', valuation: '$43B', leadInvestors: 'T. Rowe Price' },
      { date: 'Aug 2021', round: 'Series H', amount: '$1.6B', valuation: '$38B', leadInvestors: 'Counterpoint Global' },
      { date: 'Feb 2021', round: 'Series G', amount: '$1B', valuation: '$28B', leadInvestors: 'Franklin Templeton' },
    ],
    news: [
      { date: '10 Dec 2024', headline: 'Databricks announces acquisition of MosaicML to boost AI capabilities', source: 'VentureBeat' },
      { date: '1 Dec 2024', headline: 'Company reaches $2.4B ARR, up 50% year over year', source: 'Bloomberg' },
      { date: '18 Nov 2024', headline: 'IPO expected in first half of 2025, sources say', source: 'Reuters' },
      { date: '5 Nov 2024', headline: 'New Unity Catalog adoption grows 300% among enterprise clients', source: 'TechCrunch' },
    ],
    keyMetrics: [
      { metric: 'Annual Revenue', value: '$2.4B ARR' },
      { metric: 'Customers', value: '10,000+' },
      { metric: 'Data Scientists Using', value: '500K+' },
      { metric: 'Revenue Growth', value: '50% YoY' },
    ],
    description: 'Databricks provides a unified analytics platform for big data and machine learning. Built on Apache Spark, Databricks combines data engineering, data science, and business analytics. The company serves over 10,000 organizations worldwide including 60% of the Fortune 500.',
  },
  'DISCORD': {
    fundingRounds: [
      { date: 'Sep 2024', round: 'Series J', amount: '$150M', valuation: '$15.2B', leadInvestors: 'Dragoneer' },
      { date: 'Dec 2021', round: 'Series I', amount: '$500M', valuation: '$15B', leadInvestors: 'Dragoneer' },
      { date: 'Jun 2020', round: 'Series H', amount: '$100M', valuation: '$7B', leadInvestors: 'Index Ventures' },
      { date: 'Dec 2019', round: 'Series G', amount: '$150M', valuation: '$3.5B', leadInvestors: 'IVP' },
    ],
    news: [
      { date: '14 Dec 2024', headline: 'Discord reaches 200 million monthly active users', source: 'TechCrunch' },
      { date: '8 Dec 2024', headline: 'Company launches premium subscription tier with AI features', source: 'The Verge' },
      { date: '25 Nov 2024', headline: 'Discord expands into business communications market', source: 'Bloomberg' },
      { date: '10 Nov 2024', headline: 'Revenue hits $600M ARR milestone', source: 'Business Insider' },
    ],
    keyMetrics: [
      { metric: 'Monthly Active Users', value: '200M+' },
      { metric: 'Servers Created', value: '19M+' },
      { metric: 'Minutes/Day/User', value: '280+' },
      { metric: 'Annual Revenue Est.', value: '$600M' },
    ],
    description: 'Discord is a voice, video, and text communication platform originally designed for gamers but now used by communities of all types. With over 200 million monthly active users, Discord has evolved into a versatile community platform used by hobbyists, educators, and businesses.',
  },
  'CHIME': {
    fundingRounds: [
      { date: 'Aug 2024', round: 'Series H', amount: '$200M', valuation: '$25B', leadInvestors: 'Sequoia' },
      { date: 'Aug 2021', round: 'Series G', amount: '$750M', valuation: '$25B', leadInvestors: 'Sequoia' },
      { date: 'Sep 2020', round: 'Series F', amount: '$485M', valuation: '$14.5B', leadInvestors: 'DST Global' },
      { date: 'Dec 2019', round: 'Series E', amount: '$500M', valuation: '$5.8B', leadInvestors: 'DST Global' },
    ],
    news: [
      { date: '11 Dec 2024', headline: 'Chime confidentially files for IPO, targeting Q1 2025', source: 'WSJ' },
      { date: '3 Dec 2024', headline: 'Company reaches 22 million account holders', source: 'Bloomberg' },
      { date: '20 Nov 2024', headline: 'Chime launches new credit builder card features', source: 'Fintech Times' },
      { date: '5 Nov 2024', headline: 'Revenue grows 30% to estimated $1.7B annually', source: 'TechCrunch' },
    ],
    keyMetrics: [
      { metric: 'Account Holders', value: '22M+' },
      { metric: 'Annual Revenue Est.', value: '$1.7B' },
      { metric: 'Transaction Volume', value: '$8B/mo' },
      { metric: 'Fee-Free Overdrafts', value: '$14B saved' },
    ],
    description: 'Chime is a financial technology company providing fee-free mobile banking services. With over 22 million account holders, Chime offers checking accounts, savings accounts, and debit cards with no monthly fees or minimum balance requirements. The company has helped members avoid over $14 billion in overdraft fees.',
  },
  'KLARNA': {
    fundingRounds: [
      { date: 'Nov 2024', round: 'Series I', amount: '$200M', valuation: '$14.6B', leadInvestors: 'Silver Lake' },
      { date: 'Jul 2022', round: 'Series H', amount: '$800M', valuation: '$6.7B', leadInvestors: 'Sequoia' },
      { date: 'Jun 2021', round: 'Series G', amount: '$639M', valuation: '$45.6B', leadInvestors: 'SoftBank' },
      { date: 'Sep 2020', round: 'Series F', amount: '$650M', valuation: '$10.6B', leadInvestors: 'Silver Lake' },
    ],
    news: [
      { date: '13 Dec 2024', headline: 'Klarna files for US IPO, seeking $15B+ valuation', source: 'Reuters' },
      { date: '6 Dec 2024', headline: 'Company reports first annual profit since 2019', source: 'Bloomberg' },
      { date: '22 Nov 2024', headline: 'Klarna AI assistant handles 2/3 of customer service chats', source: 'TechCrunch' },
      { date: '10 Nov 2024', headline: 'US revenue surges 40% as BNPL adoption accelerates', source: 'WSJ' },
    ],
    keyMetrics: [
      { metric: 'Active Users', value: '150M+' },
      { metric: 'Retail Partners', value: '500K+' },
      { metric: 'GMV Processed', value: '$100B+' },
      { metric: 'Countries', value: '45' },
    ],
    description: 'Klarna is a Swedish fintech company that provides buy now, pay later services, payment processing, and digital banking. With over 150 million active users and 500,000 retail partners globally, Klarna is one of the largest private fintech companies in Europe.',
  },
  'PLAID': {
    fundingRounds: [
      { date: 'Apr 2024', round: 'Series E', amount: '$110M', valuation: '$13.5B', leadInvestors: 'NEA' },
      { date: 'Apr 2021', round: 'Series D', amount: '$425M', valuation: '$13.4B', leadInvestors: 'Altimeter' },
      { date: 'Dec 2018', round: 'Series C', amount: '$250M', valuation: '$2.65B', leadInvestors: 'Index Ventures' },
      { date: 'Dec 2016', round: 'Series B', amount: '$44M', valuation: '$200M', leadInvestors: 'NEA' },
    ],
    news: [
      { date: '9 Dec 2024', headline: 'Plaid partners with major banks to improve open banking', source: 'Fintech Times' },
      { date: '28 Nov 2024', headline: 'Company reaches $500M ARR milestone', source: 'Bloomberg' },
      { date: '15 Nov 2024', headline: 'Plaid expands API coverage to 12,000 financial institutions', source: 'TechCrunch' },
      { date: '1 Nov 2024', headline: 'IPO preparations underway for late 2025', source: 'WSJ' },
    ],
    keyMetrics: [
      { metric: 'Connected Accounts', value: '8,000+' },
      { metric: 'Apps Using Plaid', value: '8,000+' },
      { metric: 'Bank Connections', value: '12,000+' },
      { metric: 'Annual Revenue Est.', value: '$500M' },
    ],
    description: 'Plaid is a financial services company that builds technology enabling applications to connect with users\' bank accounts. Used by major fintech companies including Venmo, Robinhood, and Coinbase, Plaid\'s infrastructure powers the connections that help millions of people manage their finances.',
  },
  'IMPF': {
    fundingRounds: [
      { date: 'Nov 2024', round: 'Series H', amount: '$100M', valuation: '$7B', leadInvestors: 'Coatue' },
      { date: 'Nov 2021', round: 'Series G', amount: '$500M', valuation: '$7B', leadInvestors: 'Mirae Asset' },
      { date: 'Aug 2020', round: 'Series F', amount: '$200M', valuation: '$4B', leadInvestors: 'Coatue' },
      { date: 'May 2019', round: 'Series E', amount: '$300M', valuation: '$2B', leadInvestors: 'Temasek' },
    ],
    news: [
      { date: '8 Dec 2024', headline: 'Impossible Foods expands into Asia with major distribution deal', source: 'Bloomberg' },
      { date: '25 Nov 2024', headline: 'New plant-based chicken launches in 5,000 US stores', source: 'Food Business News' },
      { date: '12 Nov 2024', headline: 'Company achieves price parity with conventional beef', source: 'Reuters' },
      { date: '1 Nov 2024', headline: 'IPO plans being considered for 2025', source: 'WSJ' },
    ],
    keyMetrics: [
      { metric: 'Retail Locations', value: '40,000+' },
      { metric: 'Restaurant Partners', value: '20,000+' },
      { metric: 'CO2 Saved', value: '2M tons' },
      { metric: 'Water Saved', value: '12B gallons' },
    ],
    description: 'Impossible Foods develops plant-based substitutes for meat products. Their flagship Impossible Burger is sold in thousands of restaurants and grocery stores worldwide. The company\'s mission is to drastically reduce the environmental impact of the food system by replacing animal agriculture with sustainable alternatives.',
  },
};

export function PreIPOInvestmentModal({ preipo, clientId, open, onClose }: PreIPOInvestmentModalProps) {
  const { toast } = useToast();
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [shares, setShares] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [requestingCall, setRequestingCall] = useState(false);

  const companyInfo = preipo ? COMPANY_DATA[preipo.symbol] : null;

  useEffect(() => {
    if (open && clientId) {
      loadCashAccounts();
    }
  }, [open, clientId]);

  useEffect(() => {
    if (preipo) {
      const minInvestment = preipo.metadata_json?.min_investment || preipo.metadata_json?.minimum_investment || 25000;
      setInvestmentAmount(minInvestment);
      calculateShares(minInvestment);
    }
  }, [preipo]);

  const loadCashAccounts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('client_cash_accounts')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      setCashAccounts(data || []);
    } catch (error) {
      console.error('Error loading cash accounts:', error);
    }
  };

  const calculateShares = (amount: number) => {
    const pricePerShare = preipo.metadata_json?.price_per_share || preipo.metadata_json?.share_price || 100;
    setShares(Math.floor(amount / pricePerShare));
  };

  const handleAmountChange = (amount: number) => {
    setInvestmentAmount(amount);
    calculateShares(amount);
  };

  const handleInvest = async () => {
    const account = cashAccounts.find(a => a.currency === preipo.currency);

    if (!account || account.balance < investmentAmount) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${formatCurrency(investmentAmount, preipo.currency)} but only have ${formatCurrency(account?.balance || 0, preipo.currency)} available.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = new Date();
      const holding = {
        client_id: clientId,
        instrument_id: preipo.id,
        face_or_units: shares,
        price: pricePerShare,
        cost_basis: investmentAmount,
        current_value: investmentAmount,
        currency: preipo.currency,
        start_date: startDate.toISOString().split('T')[0],
        status: 'PENDING_PAYMENT',
      };

      const { error: holdingError } = await (supabase as any)
        .from('holdings')
        .insert(holding);

      if (holdingError) throw holdingError;

      const ledgerEntry = {
        client_id: clientId,
        transaction_type: 'INVESTMENT_FUNDING',
        currency: preipo.currency,
        amount: -investmentAmount,
        status: 'PENDING',
        reference: `Pre-IPO Investment: ${preipo.issuer_name}`,
        notes: `${shares} shares at ${formatCurrency(preipo.metadata_json?.price_per_share || preipo.metadata_json?.share_price, preipo.currency)}/share`,
        created_by: user.id,
      };

      const { error: ledgerError } = await (supabase as any)
        .from('cash_ledger')
        .insert(ledgerEntry);

      if (ledgerError) throw ledgerError;

      toast({
        title: 'Investment Submitted',
        description: 'Your Pre-IPO investment request has been submitted for admin approval.',
      });

      onClose();
    } catch (error: any) {
      console.error('Error creating investment:', error);
      toast({
        title: 'Investment Failed',
        description: error.message || 'Failed to create investment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCall = async () => {
    setRequestingCall(true);
    try {
      const { error } = await (supabase as any)
        .from('client_requests')
        .insert({
          client_id: clientId,
          request_type: 'CALL_REQUEST',
          status: 'PENDING',
          subject: `Pre-IPO Inquiry: ${preipo.issuer_name}`,
          details: `I would like to discuss investing in ${preipo.issuer_name} Pre-IPO shares. Please contact me to discuss this opportunity and provide more information.`,
        });

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
    } finally {
      setRequestingCall(false);
    }
  };

  const formatValuation = (val: number) => {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  if (!preipo) return null;

  const account = cashAccounts.find(a => a.currency === preipo.currency);
  const hasSufficientFunds = account && account.balance >= investmentAmount;
  const pricePerShare = preipo.metadata_json?.price_per_share || preipo.metadata_json?.share_price || 100;
  const minInvestment = preipo.metadata_json?.min_investment || preipo.metadata_json?.minimum_investment || 25000;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-6 border-b">
          <div className="flex items-start gap-6">
            <div className="w-32 h-20 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center p-3 shadow-sm border">
              {preipo.metadata_json?.company_logo ? (
                <Image
                  src={preipo.metadata_json.company_logo}
                  alt={preipo.issuer_name}
                  width={120}
                  height={60}
                  className="object-contain max-h-14"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {preipo.issuer_name}
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">
                  Pre-IPO
                </Badge>
              </h2>
              <p className="text-muted-foreground mt-1">{preipo.metadata_json?.sector}</p>
              <div className="flex gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold">{formatValuation(preipo.metadata_json?.valuation || 0)}</span>
                  <span className="text-muted-foreground">valuation</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">IPO {preipo.metadata_json?.expected_ipo || 'TBD'}</span>
                </div>
                {preipo.metadata_json?.headquarters && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{preipo.metadata_json.headquarters}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10">Overview</TabsTrigger>
              <TabsTrigger value="funding" className="data-[state=active]:bg-primary/10">Funding History</TabsTrigger>
              <TabsTrigger value="news" className="data-[state=active]:bg-primary/10">Latest News</TabsTrigger>
              <TabsTrigger value="invest" className="data-[state=active]:bg-primary/10">Invest</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">About the Company</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {companyInfo?.description || preipo.metadata_json?.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border-2">
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Share Price</p>
                      <p className="text-2xl font-bold">${pricePerShare}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-4 text-center">
                      <Target className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Min Investment</p>
                      <p className="text-2xl font-bold">{formatCurrency(minInvestment, preipo.currency)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Lock-up Period</p>
                      <p className="text-2xl font-bold">{preipo.metadata_json?.lockup_months || 12} mo</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-4 text-center">
                      <TrendingUp className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                      <p className="text-sm text-muted-foreground">Valuation</p>
                      <p className="text-2xl font-bold">{formatValuation(preipo.metadata_json?.valuation || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {companyInfo?.keyMetrics && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
                    <div className="grid gap-3 md:grid-cols-4">
                      {companyInfo.keyMetrics.map((metric, i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-lg border">
                          <p className="text-sm text-muted-foreground">{metric.metric}</p>
                          <p className="text-xl font-bold">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Pre-IPO investments are subject to lock-up periods and carry higher risk than publicly traded securities. Shares cannot be sold until after the IPO and lock-up period expires. This is not investment advice.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="funding" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Funding Round History
                  </h3>
                  {companyInfo?.fundingRounds ? (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Round</TableHead>
                            <TableHead>Amount Raised</TableHead>
                            <TableHead>Valuation</TableHead>
                            <TableHead>Lead Investors</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyInfo.fundingRounds.map((round, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{round.date}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{round.round}</Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-emerald-600">{round.amount}</TableCell>
                              <TableCell className="font-semibold">{round.valuation}</TableCell>
                              <TableCell className="text-muted-foreground">{round.leadInvestors}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <LineChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Funding history not available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-primary" />
                    Latest News & Updates
                  </h3>
                  {companyInfo?.news ? (
                    <div className="space-y-3">
                      {companyInfo.news.map((item, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <Newspaper className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium leading-snug">{item.headline}</p>
                                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                  <span>{item.date}</span>
                                  <span className="text-muted-foreground/50">|</span>
                                  <span>{item.source}</span>
                                </div>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No news available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="invest" className="mt-0 space-y-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Available Balance</p>
                          <p className="text-2xl font-bold">{formatCurrency(account?.balance || 0, preipo.currency)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">{preipo.currency}</Badge>
                    </div>

                    {!hasSufficientFunds && investmentAmount > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient funds. Add {formatCurrency(investmentAmount - (account?.balance || 0), preipo.currency)} more to invest.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="invest-amount">Investment Amount ({preipo.currency})</Label>
                      <Input
                        id="invest-amount"
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        min={minInvestment}
                        step={pricePerShare}
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum: {formatCurrency(minInvestment, preipo.currency)} | Price per share: ${pricePerShare}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Shares</p>
                        <p className="text-3xl font-bold text-emerald-600">{shares.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Price/Share</p>
                        <p className="text-3xl font-bold">${pricePerShare}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className="text-3xl font-bold">{formatCurrency(shares * pricePerShare, preipo.currency)}</p>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Investment is subject to admin approval. Once approved, shares will be held in your account subject to a {preipo.metadata_json?.lockup_months || 12}-month lock-up period.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRequestCall}
                    disabled={requestingCall}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Request Call
                  </Button>
                  <Button
                    onClick={handleInvest}
                    disabled={submitting || !hasSufficientFunds || investmentAmount < minInvestment || shares === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? 'Processing...' : `Invest ${formatCurrency(shares * pricePerShare, preipo.currency)}`}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
