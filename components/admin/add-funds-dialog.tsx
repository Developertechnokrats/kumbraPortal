'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  baseCurrency: string;
  onSuccess: () => void;
}

export function AddFundsDialog({ open, onOpenChange, clientId, baseCurrency, onSuccess }: AddFundsDialogProps) {
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: baseCurrency,
    date_received: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);

      const { data: cashBalance } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('client_id', clientId)
        .eq('currency', formData.currency)
        .maybeSingle();

      const currentBalance = Number((cashBalance as any)?.balance || 0);
      const newBalance = currentBalance + Number(formData.amount);

      if (cashBalance) {
        const { error: updateError } = await (supabase as any)
          .from('cash_balances')
          .update({ balance: newBalance })
          .eq('client_id', clientId)
          .eq('currency', formData.currency);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await (supabase as any)
          .from('cash_balances')
          .insert({
            client_id: clientId,
            currency: formData.currency,
            balance: newBalance,
          });

        if (insertError) throw insertError;
      }

      const { error: transactionError } = await (supabase as any)
        .from('transactions')
        .insert({
          client_id: clientId,
          amount: Number(formData.amount),
          currency: formData.currency,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          metadata_json: {
            date_received: formData.date_received,
            notes: formData.notes,
          },
          created_by: profile?.id,
        });

      if (transactionError) throw transactionError;

      alert('Funds added successfully!');
      onSuccess();
      onOpenChange(false);
      setFormData({
        amount: '',
        currency: baseCurrency,
        date_received: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error: any) {
      console.error('Error adding funds:', error);
      alert('Error adding funds: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds to Client Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount Received *</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
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
          <div className="space-y-2">
            <Label>Date Received</Label>
            <Input
              type="date"
              value={formData.date_received}
              onChange={(e) => setFormData({...formData, date_received: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes / Reference (Optional)</Label>
            <Textarea
              placeholder="Add any notes or reference information"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={processing}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Funds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
