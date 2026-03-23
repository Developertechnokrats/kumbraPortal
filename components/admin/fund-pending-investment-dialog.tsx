'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface PendingHolding {
  id: string;
  instrument: {
    issuer_name: string;
    isin: string;
  };
  currency: string;
  cost_basis: number;
  status: string;
}

interface FundPendingInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  pendingHoldings: PendingHolding[];
  cashBalance: number;
  baseCurrency: string;
  onSuccess: () => void;
}

export function FundPendingInvestmentDialog({
  open,
  onOpenChange,
  clientId,
  pendingHoldings,
  cashBalance,
  baseCurrency,
  onSuccess,
}: FundPendingInvestmentDialogProps) {
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');

  const selectedHolding = pendingHoldings.find(h => h.id === selectedHoldingId);
  const canFund = selectedHolding && cashBalance >= selectedHolding.cost_basis;

  const handleFund = async () => {
    if (!selectedHolding || !canFund) {
      alert('Insufficient funds or no holding selected');
      return;
    }

    try {
      setProcessing(true);

      const newCashBalance = cashBalance - selectedHolding.cost_basis;

      const { error: cashUpdateError } = await (supabase as any)
        .from('cash_balances')
        .update({ balance: newCashBalance })
        .eq('client_id', clientId)
        .eq('currency', baseCurrency);

      if (cashUpdateError) throw cashUpdateError;

      const { error: holdingUpdateError } = await (supabase as any)
        .from('holdings')
        .update({
          status: 'ACTIVE',
          start_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', selectedHoldingId);

      if (holdingUpdateError) throw holdingUpdateError;

      const { error: transactionError } = await (supabase as any)
        .from('transactions')
        .insert({
          client_id: clientId,
          type: 'TRADE_EXECUTION',
          amount: -selectedHolding.cost_basis,
          currency: baseCurrency,
          status: 'COMPLETED',
          metadata_json: {
            description: `Funded investment in ${selectedHolding.instrument.issuer_name} (${selectedHolding.instrument.isin})`,
            action: 'FUND_PENDING_INVESTMENT'
          }
        });

      if (transactionError) throw transactionError;

      alert('Investment funded successfully!');
      onSuccess();
      onOpenChange(false);
      setSelectedHoldingId('');
    } catch (error: any) {
      console.error('Error funding investment:', error);
      alert('Error funding investment: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fund Pending Investment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Available Cash Balance: <strong>${cashBalance.toLocaleString()} {baseCurrency}</strong>
            </AlertDescription>
          </Alert>

          {pendingHoldings.length === 0 ? (
            <Alert>
              <AlertDescription>
                No pending investments found for this client.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Select Pending Investment to Fund:</p>
              {pendingHoldings.map((holding) => {
                const isSelected = selectedHoldingId === holding.id;
                const hasSufficientFunds = cashBalance >= holding.cost_basis;

                return (
                  <div
                    key={holding.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedHoldingId(holding.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{holding.instrument.issuer_name}</h4>
                          <Badge variant="outline">{holding.instrument.isin}</Badge>
                          <Badge variant="secondary">PENDING</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Amount: <strong>${holding.cost_basis.toLocaleString()} {holding.currency}</strong></span>
                          {!hasSufficientFunds && (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Insufficient funds
                            </span>
                          )}
                          {hasSufficientFunds && (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Can fund
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedHolding && !canFund && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient funds. Required: ${selectedHolding.cost_basis.toLocaleString()}, Available: ${cashBalance.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleFund} disabled={processing || !canFund || !selectedHoldingId}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Fund Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
