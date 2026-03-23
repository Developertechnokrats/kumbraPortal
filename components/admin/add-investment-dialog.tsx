'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, addMonths, addYears, differenceInMonths } from 'date-fns';

interface AddInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

interface BondData {
  isin: string;
  issuer_name: string;
  issuer_domain: string;
  coupon_rate: number;
  maturity_date: Date;
  currency: string;
}

export function AddInvestmentDialog({ open, onOpenChange, clientId, onSuccess }: AddInvestmentDialogProps) {
  const [assetClass, setAssetClass] = useState<'FIXED_INCOME' | 'MANAGED_FUND' | 'GOLD_CONTRACT'>('FIXED_INCOME');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null);
  const [cashBalances, setCashBalances] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    instrument_id: '',
    currency: 'GBP',
    amount_invested: '',
    face_or_units: '',
    price_per_unit: '100',
    term_years: '1',
    payment_frequency: 'ANNUAL',
    first_payment_date: new Date(),
    start_date: new Date(),
  });

  const [proceedWithoutFunds, setProceedWithoutFunds] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [newBond, setNewBond] = useState<BondData>({
    isin: '',
    issuer_name: '',
    issuer_domain: '',
    coupon_rate: 0,
    maturity_date: addYears(new Date(), 5),
    currency: 'GBP',
  });

  const [createNewInstrument, setCreateNewInstrument] = useState(false);

  useEffect(() => {
    if (open) {
      loadInstruments();
      loadCashBalances();
    }
  }, [open, assetClass]);

  useEffect(() => {
    if (formData.amount_invested && formData.price_per_unit) {
      const units = parseFloat(formData.amount_invested) / parseFloat(formData.price_per_unit);
      setFormData((prev) => ({ ...prev, face_or_units: units.toFixed(2) }));
    }
  }, [formData.amount_invested, formData.price_per_unit]);

  const loadInstruments = async () => {
    const { data } = await supabase
      .from('instruments')
      .select('*')
      .eq('asset_class', assetClass)
      .eq('is_active', true);
    setInstruments(data || []);
  };

  const loadCashBalances = async () => {
    const { data } = await supabase
      .from('cash_balances')
      .select('*')
      .eq('client_id', clientId);
    setCashBalances(data || []);
  };

  const handleInstrumentChange = (instrumentId: string) => {
    const instrument = instruments.find((i) => i.id === instrumentId);
    setSelectedInstrument(instrument);

    const defaultCurrency = instrument?.metadata_json?.default_currency || instrument?.currency || 'GBP';

    let pricePerUnit = '100';
    if (instrument?.asset_class === 'MANAGED_FUND') {
      pricePerUnit = (instrument.metadata_json?.current_nav || 1.0000).toString();
    }

    setFormData((prev) => ({
      ...prev,
      instrument_id: instrumentId,
      currency: defaultCurrency,
      price_per_unit: pricePerUnit,
    }));
  };

  const getAvailableTerms = () => {
    if (!selectedInstrument?.metadata_json?.term_options) {
      return [1, 2, 3];
    }
    return selectedInstrument.metadata_json.term_options;
  };

  const getAvailableCurrencies = () => {
    if (!selectedInstrument?.metadata_json?.currency_options) {
      return ['GBP', 'USD', 'EUR'];
    }
    return selectedInstrument.metadata_json.currency_options;
  };

  const getAvailableFrequencies = () => {
    if (!selectedInstrument?.coupon_schedule_json?.frequency_options) {
      return ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'];
    }
    const freqMap: Record<string, string> = {
      'Monthly': 'MONTHLY',
      'Quarterly': 'QUARTERLY',
      'Semi-annual': 'BIANNUAL',
      'Annual': 'ANNUAL'
    };
    return selectedInstrument.coupon_schedule_json.frequency_options.map((f: string) => freqMap[f] || f.toUpperCase());
  };

  const getMinimumInvestment = () => {
    return selectedInstrument?.metadata_json?.min_investment || 50000;
  };

  const getIssuerLogo = (domain: string) => {
    return `https://logo.clearbit.com/${domain}`;
  };

  const handleCreateBond = async () => {
    try {
      const { data: instrumentData, error: instrumentError } = await (supabase as any)
        .from('instruments')
        .insert({
          asset_class: 'FIXED_INCOME',
          issuer_name: newBond.issuer_name,
          issuer_domain: newBond.issuer_domain,
          isin: newBond.isin,
          currency: newBond.currency,
          metadata_json: {
            bond_name: `${newBond.issuer_name} Bond`,
            coupon_rate: newBond.coupon_rate,
            maturity_date: newBond.maturity_date.toISOString(),
          },
        })
        .select()
        .single();

      if (instrumentError) throw instrumentError;

      setFormData((prev) => ({ ...prev, instrument_id: (instrumentData as any).id }));
      setSelectedInstrument(instrumentData as any);
      setCreateNewInstrument(false);
      await loadInstruments();
    } catch (error: any) {
      alert('Error creating bond: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const amountInvested = parseFloat(formData.amount_invested);
      const faceOrUnits = parseFloat(formData.face_or_units);
      const pricePerUnit = parseFloat(formData.price_per_unit);

      const currentBalance = cashBalances.find((b) => b.currency === formData.currency);
      const hasInsufficientFunds = !currentBalance || currentBalance.balance < amountInvested;

      if (hasInsufficientFunds && !proceedWithoutFunds) {
        throw new Error(`Insufficient ${formData.currency} balance`);
      }

      const holdingStatus = hasInsufficientFunds ? 'PENDING_PAYMENT' : 'ACTIVE';

      let holdingData: any = {
        client_id: clientId,
        instrument_id: formData.instrument_id,
        currency: formData.currency,
        face_or_units: faceOrUnits,
        price: pricePerUnit,
        cost_basis: amountInvested,
        current_value: amountInvested,
        unrealised_pl: 0,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        status: holdingStatus,
      };

      if (assetClass === 'FIXED_INCOME') {
        const termMonths = parseInt(formData.term_years) * 12;
        const maturityDate = addMonths(formData.start_date, termMonths);
        holdingData = {
          ...holdingData,
          term_months: termMonths,
          maturity_date: format(maturityDate, 'yyyy-MM-dd'),
          payment_frequency: formData.payment_frequency,
        };
      }

      const { error: holdingError } = await (supabase as any).from('holdings').insert(holdingData);

      if (holdingError) throw holdingError;

      if (!hasInsufficientFunds) {
        const { error: balanceError } = await (supabase as any)
          .from('cash_balances')
          .update({ balance: currentBalance.balance - amountInvested })
          .eq('client_id', clientId)
          .eq('currency', formData.currency);

        if (balanceError) throw balanceError;

        const { error: txError } = await (supabase as any).from('transactions').insert({
          client_id: clientId,
          type: 'TRADE_EXECUTION',
          amount: -amountInvested,
          currency: formData.currency,
          status: 'COMPLETED',
          metadata_json: {
            description: `Investment in ${selectedInstrument?.issuer_name || 'instrument'}`,
          },
        });

        if (txError) throw txError;
      } else {
        const { error: txError } = await (supabase as any).from('transactions').insert({
          client_id: clientId,
          type: 'TRADE_EXECUTION',
          amount: -amountInvested,
          currency: formData.currency,
          status: 'PENDING',
          metadata_json: {
            description: `Investment in ${selectedInstrument?.issuer_name || 'instrument'} - Awaiting Payment`,
          },
        });

        if (txError) throw txError;
      }

      const statusMessage = hasInsufficientFunds
        ? 'Investment created with pending payment status. Please fund this investment to activate it.'
        : 'Investment added successfully!';

      alert(statusMessage);
      setShowConfirmation(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding investment:', error);
      alert('Error: ' + error.message);
      setShowConfirmation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>Configure a new investment position for this client</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-2">
            <Label>Asset Class</Label>
            <Select value={assetClass} onValueChange={(value: any) => setAssetClass(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED_INCOME">Fixed Income / Bonds</SelectItem>
                <SelectItem value="MANAGED_FUND">Managed Funds / ETFs</SelectItem>
                <SelectItem value="GOLD_CONTRACT">Gold Contracts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assetClass === 'MANAGED_FUND' && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Managed Fund / ETF</Label>
                <Select value={formData.instrument_id} onValueChange={handleInstrumentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund..." />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.id}>
                        <div className="flex items-center gap-2">
                          <span>{instrument.issuer_name} - {instrument.metadata_json?.fund_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInstrument && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fund Name:</span>
                        <span className="font-medium">{selectedInstrument.metadata_json?.fund_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current NAV:</span>
                        <span className="font-medium">{selectedInstrument.metadata_json?.current_nav?.toFixed(4) || '1.0000'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Rating:</span>
                        <span className="font-medium">{selectedInstrument.risk_rating || 'MEDIUM'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {assetClass === 'FIXED_INCOME' && (
            <Tabs value={createNewInstrument ? 'new' : 'existing'}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing" onClick={() => setCreateNewInstrument(false)}>
                  Select Existing Bond
                </TabsTrigger>
                <TabsTrigger value="new" onClick={() => setCreateNewInstrument(true)}>
                  Create New Bond
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Bond / Fixed Income Instrument</Label>
                  <Select value={formData.instrument_id} onValueChange={handleInstrumentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bond..." />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((instrument) => (
                        <SelectItem key={instrument.id} value={instrument.id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={getIssuerLogo(instrument.issuer_domain)}
                              alt=""
                              className="h-4 w-4"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <span>
                              {instrument.issuer_name} - {instrument.isin} - {instrument.metadata_json?.coupon_rate}%
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstrument && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={getIssuerLogo(selectedInstrument.issuer_domain)}
                          alt=""
                          className="h-12 w-12 rounded"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">ISIN:</span>
                            <span className="font-medium">{selectedInstrument.isin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Coupon:</span>
                            <span className="font-medium">{selectedInstrument.metadata_json?.coupon_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Issuer:</span>
                            <span className="font-medium">{selectedInstrument.issuer_name}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>ISIN</Label>
                    <Input
                      value={newBond.isin}
                      onChange={(e) => setNewBond({ ...newBond, isin: e.target.value })}
                      placeholder="GB00B24FF097"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Issuer Name</Label>
                      <Input
                        value={newBond.issuer_name}
                        onChange={(e) => setNewBond({ ...newBond, issuer_name: e.target.value })}
                        placeholder="UK Government"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Issuer Domain</Label>
                      <Input
                        value={newBond.issuer_domain}
                        onChange={(e) => setNewBond({ ...newBond, issuer_domain: e.target.value })}
                        placeholder="gov.uk"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Coupon Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newBond.coupon_rate}
                        onChange={(e) => setNewBond({ ...newBond, coupon_rate: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select value={newBond.currency} onValueChange={(value) => setNewBond({ ...newBond, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateBond}>Create Bond</Button>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {formData.instrument_id && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount to Invest</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount_invested}
                    onChange={(e) => {
                      setFormData({ ...formData, amount_invested: e.target.value });
                      setProceedWithoutFunds(false);
                    }}
                    placeholder="50000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {cashBalances.find((b) => b.currency === formData.currency)?.balance.toLocaleString() || '0'}{' '}
                    {formData.currency}
                  </p>
                  {formData.amount_invested && (
                    (() => {
                      const currentBalance = cashBalances.find((b) => b.currency === formData.currency);
                      const amountInvested = parseFloat(formData.amount_invested);
                      const hasInsufficientFunds = !currentBalance || currentBalance.balance < amountInvested;

                      return hasInsufficientFunds ? (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2 flex-1">
                            <p className="text-sm text-amber-800">
                              <strong>Insufficient Funds:</strong> Client does not have enough balance to fund this investment.
                            </p>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="proceed-without-funds"
                                checked={proceedWithoutFunds}
                                onCheckedChange={(checked) => setProceedWithoutFunds(checked as boolean)}
                              />
                              <Label htmlFor="proceed-without-funds" className="text-sm font-normal cursor-pointer text-amber-900">
                                Proceed and mark as Pending Payment
                              </Label>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>Price per Unit {assetClass === 'MANAGED_FUND' && '(NAV)'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    disabled={assetClass === 'MANAGED_FUND'}
                    className={assetClass === 'MANAGED_FUND' ? 'bg-muted' : ''}
                  />
                  {assetClass === 'MANAGED_FUND' && (
                    <p className="text-xs text-muted-foreground">Current Net Asset Value from fund pricing</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Units / Face Value</Label>
                <Input type="number" step="0.01" value={formData.face_or_units} disabled className="bg-muted" />
              </div>

              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCurrencies().map((currency: string) => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Minimum investment: {getMinimumInvestment().toLocaleString()} {formData.currency}
                </p>
              </div>

              {assetClass === 'FIXED_INCOME' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Term</Label>
                    <Select value={formData.term_years} onValueChange={(value) => setFormData({ ...formData, term_years: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTerms().map((term: number) => (
                          <SelectItem key={term} value={term.toString()}>
                            {term} {term === 1 ? 'Year' : 'Years'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Payment Frequency</Label>
                    <Select
                      value={formData.payment_frequency}
                      onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableFrequencies().map((freq: string) => (
                          <SelectItem key={freq} value={freq}>
                            {freq.charAt(0) + freq.slice(1).toLowerCase().replace('biannual', 'Bi-Annual')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.start_date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.start_date} onSelect={(date) => date && setFormData({ ...formData, start_date: date })} />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowConfirmation(true)} disabled={!formData.instrument_id || !formData.amount_invested}>
            Add Investment
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Investment Creation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this investment?
              {(() => {
                const amountInvested = parseFloat(formData.amount_invested);
                const currentBalance = cashBalances.find((b) => b.currency === formData.currency);
                const hasInsufficientFunds = !currentBalance || currentBalance.balance < amountInvested;

                return (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{clientId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Instrument:</span>
                      <span className="font-medium">{selectedInstrument?.issuer_name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{amountInvested.toLocaleString()} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${hasInsufficientFunds ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {hasInsufficientFunds ? 'Pending Payment' : 'Active'}
                      </span>
                    </div>
                    {hasInsufficientFunds && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-800">
                          This investment will be created with Pending Payment status due to insufficient funds.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirm and Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
