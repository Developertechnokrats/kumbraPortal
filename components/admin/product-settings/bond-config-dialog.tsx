'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Plus, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyLogo } from '@/components/ui/company-logo';

interface BondConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bond: any;
  onSuccess: () => void;
}

export function BondConfigDialog({ open, onOpenChange, bond, onSuccess }: BondConfigDialogProps) {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    minInvestment: 50000,
    currencyOptions: ['GBP'],
    defaultCurrency: 'GBP',
    termOptions: [1, 2, 3],
    frequencyOptions: ['Quarterly', 'Semi-annual', 'Annual'],
    paymentDates: [] as string[]
  });
  const [newPaymentDate, setNewPaymentDate] = useState('');

  const availableCurrencies = ['GBP', 'USD', 'EUR'];
  const availableFrequencies = ['Monthly', 'Quarterly', 'Semi-annual', 'Annual'];
  const availableTerms = [1, 2, 3, 4, 5, 7, 10];

  useEffect(() => {
    if (bond && open) {
      const metadata = bond.metadata_json || {};
      const schedule = bond.coupon_schedule_json || {};

      setConfig({
        minInvestment: metadata.min_investment || 50000,
        currencyOptions: metadata.currency_options || ['GBP'],
        defaultCurrency: metadata.default_currency || 'GBP',
        termOptions: metadata.term_options || [1, 2, 3],
        frequencyOptions: schedule.frequency_options || ['Quarterly', 'Semi-annual', 'Annual'],
        paymentDates: schedule.payment_dates || []
      });
    }
  }, [bond, open]);

  const handleSave = async () => {
    if (config.currencyOptions.length === 0) {
      toast.error('Please select at least one currency option');
      return;
    }

    if (config.termOptions.length === 0) {
      toast.error('Please select at least one term option');
      return;
    }

    if (config.frequencyOptions.length === 0) {
      toast.error('Please select at least one payment frequency');
      return;
    }

    try {
      setSaving(true);

      const updatedMetadata = {
        ...bond.metadata_json,
        min_investment: config.minInvestment,
        currency_options: config.currencyOptions,
        default_currency: config.defaultCurrency,
        term_options: config.termOptions.sort((a, b) => a - b)
      };

      const updatedSchedule = {
        ...bond.coupon_schedule_json,
        frequency_options: config.frequencyOptions,
        payment_dates: config.paymentDates.sort()
      };

      const { error } = await (supabase
        .from('instruments') as any)
        .update({
          metadata_json: updatedMetadata,
          coupon_schedule_json: updatedSchedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', bond.id);

      if (error) throw error;

      toast.success(`Settings updated for ${bond.issuer_name}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving bond config:', error);
      toast.error('Failed to save configuration: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCurrency = (currency: string) => {
    setConfig(prev => ({
      ...prev,
      currencyOptions: prev.currencyOptions.includes(currency)
        ? prev.currencyOptions.filter(c => c !== currency)
        : [...prev.currencyOptions, currency]
    }));
  };

  const toggleFrequency = (freq: string) => {
    setConfig(prev => ({
      ...prev,
      frequencyOptions: prev.frequencyOptions.includes(freq)
        ? prev.frequencyOptions.filter(f => f !== freq)
        : [...prev.frequencyOptions, freq]
    }));
  };

  const toggleTerm = (term: number) => {
    setConfig(prev => ({
      ...prev,
      termOptions: prev.termOptions.includes(term)
        ? prev.termOptions.filter(t => t !== term)
        : [...prev.termOptions, term]
    }));
  };

  const addPaymentDate = () => {
    if (!newPaymentDate) {
      toast.error('Please enter a payment date');
      return;
    }

    if (config.paymentDates.includes(newPaymentDate)) {
      toast.error('This date is already added');
      return;
    }

    setConfig(prev => ({
      ...prev,
      paymentDates: [...prev.paymentDates, newPaymentDate].sort()
    }));
    setNewPaymentDate('');
  };

  const removePaymentDate = (date: string) => {
    setConfig(prev => ({
      ...prev,
      paymentDates: prev.paymentDates.filter(d => d !== date)
    }));
  };

  if (!bond) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CompanyLogo
              issuerName={bond.issuer_name}
              customLogoUrl={bond.metadata_json?.company_logo}
              size="sm"
            />
            <div>
              <div>{bond.issuer_name}</div>
              <div className="text-sm font-normal text-muted-foreground">{bond.isin}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Minimum Investment</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1000"
                value={config.minInvestment}
                onChange={(e) => setConfig({ ...config, minInvestment: parseInt(e.target.value) || 0 })}
                className="max-w-xs"
              />
              <span className="text-sm text-muted-foreground">GBP</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Minimum amount required to invest in this bond
            </p>
          </div>

          <div className="space-y-3">
            <Label>Currency Options</Label>
            <p className="text-sm text-muted-foreground">
              Select which currencies clients can use to invest in this bond
            </p>
            <div className="flex flex-wrap gap-4">
              {availableCurrencies.map((currency) => (
                <div key={currency} className="flex items-center space-x-2">
                  <Checkbox
                    id={`currency-${currency}`}
                    checked={config.currencyOptions.includes(currency)}
                    onCheckedChange={() => toggleCurrency(currency)}
                  />
                  <Label htmlFor={`currency-${currency}`} className="font-normal cursor-pointer">
                    {currency}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Label className="text-sm">Default Currency</Label>
              <div className="flex gap-2 mt-2">
                {config.currencyOptions.map((currency) => (
                  <Button
                    key={currency}
                    type="button"
                    variant={config.defaultCurrency === currency ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig({ ...config, defaultCurrency: currency })}
                  >
                    {currency}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Frequency Options</Label>
            <p className="text-sm text-muted-foreground">
              Select which payment frequencies are available for this bond
            </p>
            <div className="space-y-2">
              {availableFrequencies.map((freq) => (
                <div key={freq} className="flex items-center space-x-2">
                  <Checkbox
                    id={`freq-${freq}`}
                    checked={config.frequencyOptions.includes(freq)}
                    onCheckedChange={() => toggleFrequency(freq)}
                  />
                  <Label htmlFor={`freq-${freq}`} className="font-normal cursor-pointer">
                    {freq}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Term Options</Label>
            <p className="text-sm text-muted-foreground">
              Select which term lengths (in years) are available for this bond
            </p>
            <div className="flex flex-wrap gap-4">
              {availableTerms.map((term) => (
                <div key={term} className="flex items-center space-x-2">
                  <Checkbox
                    id={`term-${term}`}
                    checked={config.termOptions.includes(term)}
                    onCheckedChange={() => toggleTerm(term)}
                  />
                  <Label htmlFor={`term-${term}`} className="font-normal cursor-pointer">
                    {term} {term === 1 ? 'Year' : 'Years'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label>Dividend Payment Dates</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add specific dates when dividend/coupon payments are scheduled
            </p>

            <div className="flex gap-2">
              <Input
                type="date"
                value={newPaymentDate}
                onChange={(e) => setNewPaymentDate(e.target.value)}
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addPaymentDate}>
                <Plus className="h-4 w-4 mr-1" />
                Add Date
              </Button>
            </div>

            {config.paymentDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {config.paymentDates.map((date) => (
                  <Badge key={date} variant="secondary" className="pl-2 pr-1">
                    {new Date(date).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => removePaymentDate(date)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
