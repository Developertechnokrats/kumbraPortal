'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Calculator, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { CompanyLogo } from '@/components/ui/company-logo';

interface AddIPOHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function AddIPOHoldingDialog({ open, onOpenChange, clientId, onSuccess }: AddIPOHoldingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [overrideInsufficientFunds, setOverrideInsufficientFunds] = useState(false);
  const [formData, setFormData] = useState({
    instrument_id: '',
    currency: 'USD',
    shares: '',
    price_per_share: '',
  });

  useEffect(() => {
    if (open) {
      loadIPOs();
      loadClientBalance();
    }
  }, [open, clientId]);

  const loadIPOs = async () => {
    const { data } = await supabase
      .from('instruments')
      .select('*')
      .eq('asset_class', 'PRE_IPO')
      .eq('is_active', true)
      .order('issuer_name');

    setInstruments(data || []);
  };

  const loadClientBalance = async () => {
    const { data } = await supabase
      .from('cash_balances')
      .select('available_balance, currency')
      .eq('client_id', clientId)
      .eq('currency', formData.currency)
      .maybeSingle();

    setAvailableBalance((data as any)?.available_balance || 0);
  };

  useEffect(() => {
    if (open && clientId) {
      loadClientBalance();
    }
  }, [formData.currency, open, clientId]);

  const selectedInstrument = instruments.find((i) => i.id === formData.instrument_id);
  const numShares = parseFloat(formData.shares) || 0;
  const pricePerShare = parseFloat(formData.price_per_share) || 0;
  const totalCost = numShares * pricePerShare;
  const currentPrice = selectedInstrument?.metadata_json?.price_per_share || pricePerShare;
  const currentValue = numShares * currentPrice;
  const unrealisedPL = currentValue - totalCost;
  const hasSufficientFunds = availableBalance >= totalCost;
  const shortfall = totalCost - availableBalance;

  const handleSubmit = async () => {
    if (!formData.instrument_id || !formData.shares || !formData.price_per_share) {
      alert('Please fill in all fields');
      return;
    }

    if (numShares <= 0 || pricePerShare <= 0) {
      alert('Shares and price must be greater than zero');
      return;
    }

    if (!hasSufficientFunds && !overrideInsufficientFunds) {
      alert('Insufficient funds. Please enable override to proceed with pending payment status.');
      return;
    }

    try {
      setLoading(true);

      const holdingStatus = hasSufficientFunds || !overrideInsufficientFunds ? 'ACTIVE' : 'PENDING_PAYMENT';

      const { error: holdingError } = await (supabase.from('holdings') as any).insert({
        client_id: clientId,
        instrument_id: formData.instrument_id,
        currency: formData.currency,
        face_or_units: numShares,
        price: pricePerShare,
        cost_basis: totalCost,
        current_value: currentValue,
        unrealised_pl: unrealisedPL,
        start_date: new Date().toISOString().split('T')[0],
        term_months: null,
        maturity_date: null,
        payment_frequency: null,
        status: holdingStatus,
      });

      if (holdingError) throw holdingError;

      if (hasSufficientFunds) {
        const { data: balanceData } = await supabase
          .from('cash_balances')
          .select('available_balance')
          .eq('client_id', clientId)
          .eq('currency', formData.currency)
          .maybeSingle();

        const newBalance = ((balanceData as any)?.available_balance || 0) - totalCost;

        await (supabase.from('cash_balances') as any).upsert({
          client_id: clientId,
          currency: formData.currency,
          available_balance: newBalance,
          total_balance: newBalance,
        });
      }

      await (supabase.from('transactions') as any).insert({
        client_id: clientId,
        type: holdingStatus === 'PENDING_PAYMENT' ? 'PENDING_INVESTMENT' : 'INVESTMENT',
        amount: totalCost,
        currency: formData.currency,
        description: `Pre-IPO Investment: ${selectedInstrument?.issuer_name} - ${numShares} shares @ ${formatCurrency(pricePerShare, formData.currency)}`,
        status: holdingStatus === 'PENDING_PAYMENT' ? 'PENDING' : 'COMPLETED',
        transaction_date: new Date().toISOString(),
      });

      alert(`Pre-IPO holding added successfully${holdingStatus === 'PENDING_PAYMENT' ? ' (Pending Payment)' : ''}!`);
      setFormData({ instrument_id: '', currency: 'USD', shares: '', price_per_share: '' });
      setOverrideInsufficientFunds(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding holding:', error);
      alert('Failed to add holding: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Pre-IPO Holding</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instrument">Select Company</Label>
            <Select value={formData.instrument_id} onValueChange={(value) => setFormData({ ...formData, instrument_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Pre-IPO company..." />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    <div className="flex items-center gap-2">
                      <CompanyLogo
                        issuerName={instrument.issuer_name}
                        issuerDomain={instrument.issuer_domain}
                        customLogoUrl={instrument.metadata_json?.company_logo}
                        size="sm"
                        className="h-5 w-5"
                      />
                      <span className="font-semibold">{instrument.symbol}</span>
                      <span className="text-muted-foreground">- {instrument.issuer_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInstrument && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <CompanyLogo
                  issuerName={selectedInstrument.issuer_name}
                  issuerDomain={selectedInstrument.issuer_domain}
                  customLogoUrl={selectedInstrument.metadata_json?.company_logo}
                  size="md"
                />
                <div>
                  <p className="font-semibold">{selectedInstrument.issuer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInstrument.symbol}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Sector</p>
                  <p className="font-semibold text-sm">{selectedInstrument.metadata_json?.sector || 'Technology'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected IPO</p>
                  <p className="font-semibold text-sm">{selectedInstrument.metadata_json?.expected_ipo || 'TBD'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valuation</p>
                  <p className="font-semibold text-sm">
                    ${((selectedInstrument.metadata_json?.valuation || 0) / 1000000000).toFixed(1)}B
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_per_share">Price Per Share</Label>
              <Input
                id="price_per_share"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_share}
                onChange={(e) => setFormData({ ...formData, price_per_share: e.target.value })}
                placeholder="e.g., 50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shares">Total Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                step="1"
                min="0"
                value={formData.shares}
                onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>
          </div>

          {numShares > 0 && pricePerShare > 0 && (
            <>
              <div className="p-4 border rounded-lg space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-700" />
                  <p className="font-semibold text-blue-900">Investment Summary</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-white rounded border">
                    <p className="text-muted-foreground text-xs">Total Investment</p>
                    <p className="font-bold text-lg text-blue-900">{formatCurrency(totalCost, formData.currency)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-muted-foreground text-xs">Available Balance</p>
                    <p className="font-bold text-lg text-blue-900">{formatCurrency(availableBalance, formData.currency)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-muted-foreground text-xs">Current Value</p>
                    <p className="font-bold text-lg text-blue-900">{formatCurrency(currentValue, formData.currency)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-muted-foreground text-xs">Unrealised P/L</p>
                    <p className={`font-bold text-lg ${unrealisedPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {unrealisedPL >= 0 ? '+' : ''}{formatCurrency(unrealisedPL, formData.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {!hasSufficientFunds && (
                <Alert variant="destructive" className="border-orange-500 bg-orange-50">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    <div className="font-semibold mb-2">Insufficient Funds</div>
                    <div className="text-sm">
                      Available: {formatCurrency(availableBalance, formData.currency)}
                      <br />
                      Required: {formatCurrency(totalCost, formData.currency)}
                      <br />
                      <span className="font-bold">Shortfall: {formatCurrency(shortfall, formData.currency)}</span>
                    </div>
                    <div className="mt-3 flex items-start space-x-2">
                      <Checkbox
                        id="override"
                        checked={overrideInsufficientFunds}
                        onCheckedChange={(checked) => setOverrideInsufficientFunds(checked as boolean)}
                      />
                      <label
                        htmlFor="override"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Override and create investment with PENDING PAYMENT status
                      </label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.instrument_id || !formData.shares || !formData.price_per_share}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Holding'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
