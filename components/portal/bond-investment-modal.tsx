'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyLogo } from '@/components/ui/company-logo';
import { BondCalculator } from '@/components/portal/bond-calculator';
import { AlertCircle, CheckCircle, Phone, Wallet, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';

interface BondInvestmentModalProps {
  bond: any;
  clientId: string;
  open: boolean;
  onClose: () => void;
}

export function BondInvestmentModal({ bond, clientId, open, onClose }: BondInvestmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState(bond?.metadata_json?.min_investment || 50000);
  const [termMonths, setTermMonths] = useState(12);
  const [paymentFrequency, setPaymentFrequency] = useState('QUARTERLY');
  const [submitting, setSubmitting] = useState(false);
  const [requestingCall, setRequestingCall] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      loadCashAccounts();
    }
  }, [open, clientId]);

  useEffect(() => {
    if (bond) {
      setInvestmentAmount(bond.metadata_json?.min_investment || 50000);
      if (bond.metadata_json?.term_options && bond.metadata_json.term_options.length > 0) {
        setTermMonths(bond.metadata_json.term_options[0]);
      }
    }
  }, [bond]);

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

  const handleInvest = async () => {
    const account = cashAccounts.find(a => a.currency === bond.currency);

    if (!account || account.balance < investmentAmount) {
      toast({
        title: 'Insufficient Funds',
        description: `You need ${formatCurrency(investmentAmount, bond.currency)} but only have ${formatCurrency(account?.balance || 0, bond.currency)} available.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + termMonths);

      const holding = {
        client_id: clientId,
        instrument_id: bond.id,
        face_or_units: investmentAmount,
        price: 1,
        cost_basis: investmentAmount,
        current_value: investmentAmount,
        currency: bond.currency,
        start_date: startDate.toISOString().split('T')[0],
        term_months: termMonths,
        maturity_date: maturityDate.toISOString().split('T')[0],
        payment_frequency: paymentFrequency,
        status: 'PENDING_PAYMENT',
      };

      const { data: holdingData, error: holdingError } = await (supabase as any)
        .from('holdings')
        .insert(holding)
        .select()
        .single();

      if (holdingError) throw holdingError;

      const ledgerEntry = {
        client_id: clientId,
        transaction_type: 'INVESTMENT_FUNDING',
        currency: bond.currency,
        amount: -investmentAmount,
        status: 'PENDING',
        reference: `Bond Investment: ${bond.issuer_name}`,
        notes: `${bond.metadata_json?.coupon_rate}% p.a. for ${termMonths} months`,
        created_by: user.id,
      };

      const { error: ledgerError } = await (supabase as any)
        .from('cash_ledger')
        .insert(ledgerEntry);

      if (ledgerError) throw ledgerError;

      toast({
        title: 'Investment Submitted',
        description: 'Your bond investment request has been submitted for admin approval.',
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
          subject: `Investment Inquiry: ${bond.issuer_name}`,
          details: `I would like to discuss investing in ${bond.issuer_name} - ${bond.metadata_json?.coupon_rate}% Bond. Please contact me to discuss this opportunity.`,
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

  if (!bond) return null;

  const account = cashAccounts.find(a => a.currency === bond.currency);
  const hasSufficientFunds = account && account.balance >= investmentAmount;
  const couponRate = bond.metadata_json?.coupon_rate || 0;
  const termOptions = bond.metadata_json?.term_options || [12, 24, 36];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <CompanyLogo
              issuerName={bond.issuer_name}
              issuerDomain={bond.issuer_domain}
              customLogoUrl={bond.metadata_json?.company_logo}
              size="lg"
              variant="horizontal"
            />
            <div className="flex-1">
              <DialogTitle className="text-2xl">{bond.issuer_name}</DialogTitle>
              <DialogDescription>{bond.metadata_json?.description}</DialogDescription>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline">{bond.currency}</Badge>
                <Badge variant="outline">{bond.metadata_json?.rating}</Badge>
                <Badge className="bg-primary/10 text-primary">{couponRate}% p.a.</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="calculator" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator">Calculator & Details</TabsTrigger>
            <TabsTrigger value="invest">Invest Now</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <BondCalculator bond={bond} />
          </TabsContent>

          <TabsContent value="invest" className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Available Balance</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatCurrency(account?.balance || 0, bond.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">{bond.currency} Account</div>
                  </div>
                </div>

                {!hasSufficientFunds && investmentAmount > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient funds. You need {formatCurrency(investmentAmount - (account?.balance || 0), bond.currency)} more to complete this investment.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invest-amount">Investment Amount ({bond.currency})</Label>
                    <Input
                      id="invest-amount"
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                      min={bond.metadata_json?.min_investment || 10000}
                      step={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum: {formatCurrency(bond.metadata_json?.min_investment || 10000, bond.currency)}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invest-term">Investment Term</Label>
                      <Select value={termMonths.toString()} onValueChange={(v) => setTermMonths(parseInt(v))}>
                        <SelectTrigger id="invest-term">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {termOptions.map((months: number) => (
                            <SelectItem key={months} value={months.toString()}>
                              {months >= 12 ? `${months / 12} Year${months > 12 ? 's' : ''}` : `${months} Months`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invest-frequency">Payment Frequency</Label>
                      <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                        <SelectTrigger id="invest-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="BIANNUAL">Semi-Annual</SelectItem>
                          <SelectItem value="ANNUAL">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Expected Annual Return</div>
                    <div className="text-xl font-bold text-primary">{couponRate}% p.a.</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Investment</div>
                    <div className="text-xl font-bold">{formatCurrency(investmentAmount, bond.currency)}</div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your investment will be submitted for admin approval. Once approved, funds will be deducted from your {bond.currency} cash account and your bond holding will be activated.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleRequestCall}
            disabled={requestingCall}
          >
            <Phone className="h-4 w-4 mr-2" />
            Request Call from Account Manager
          </Button>
          <Button
            onClick={handleInvest}
            disabled={submitting || !hasSufficientFunds || investmentAmount < (bond.metadata_json?.min_investment || 0)}
          >
            {submitting ? 'Processing...' : `Invest ${formatCurrency(investmentAmount, bond.currency)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
