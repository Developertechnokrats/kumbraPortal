'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils/format';

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountDue: number;
  currency: string;
  onSuccess?: () => void;
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  amountDue,
  currency,
  onSuccess,
}: ConfirmPaymentDialogProps) {
  const { client } = useAuth();
  const [amount, setAmount] = useState(amountDue > 0 ? amountDue.toString() : '');
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'GBP');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setReceiptFile(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!client) return;
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let receiptUrl = '';

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${client.id}/${Date.now()}_payment_receipt.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, receiptFile);

        if (uploadError) {
          console.warn('Receipt upload failed:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('client-documents')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
        }
      }

      const { error: insertError } = await (supabase as any)
        .from('deposit_notifications')
        .insert({
          client_id: client.id,
          amount: parseFloat(amount),
          currency: selectedCurrency,
          payment_method: 'BANK_TRANSFER',
          reference: reference || null,
          receipt_url: receiptUrl || null,
          status: 'PENDING',
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSuccess(false);
        setAmount('');
        setReference('');
        setNotes('');
        setReceiptFile(null);
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting payment notification:', err);
      setError(err.message || 'Failed to submit payment notification');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      setSuccess(false);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Payment Made</DialogTitle>
          <DialogDescription>
            Let us know you've made a payment so we can credit your account
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Payment Notification Received</h3>
            <p className="text-muted-foreground">
              We'll verify your payment and credit your account within 1-2 business days.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {amountDue > 0 && (
              <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Amount due for pending investments: <strong>{formatCurrency(amountDue, currency)}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="amount">Amount Transferred</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference (Optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., bank transfer reference number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Payment Receipt (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {receiptFile ? (
                    <p className="text-sm font-medium text-emerald-600">{receiptFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to upload receipt</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or image (max 10MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || !amount || parseFloat(amount) <= 0}>
              {uploading ? 'Submitting...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
