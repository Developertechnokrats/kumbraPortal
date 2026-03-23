'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, CheckCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositNotificationFormProps {
  clientId: string;
  onSuccess?: () => void;
}

export function DepositNotificationForm({ clientId, onSuccess }: DepositNotificationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'GBP',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let receiptUrl = null;
      if (file) {
        receiptUrl = await uploadFile(file);
        if (!receiptUrl) {
          throw new Error('Failed to upload receipt');
        }
      }

      const { error } = await (supabase as any)
        .from('deposit_notifications')
        .insert({
          client_id: clientId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          payment_method: formData.paymentMethod,
          reference: formData.reference || null,
          receipt_url: receiptUrl,
          status: 'PENDING',
        });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Deposit Notification Sent',
        description: 'Your deposit notification has been submitted. You will be notified once the funds have been verified and credited.',
      });

      // Reset form
      setFormData({
        amount: '',
        currency: 'GBP',
        paymentMethod: 'BANK_TRANSFER',
        reference: '',
      });
      setFile(null);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setSuccess(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error submitting deposit notification:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit deposit notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">Notification Submitted</h3>
            <p className="text-green-700 text-center max-w-md">
              Your deposit notification has been received. We'll verify the payment and credit your account shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Notify Deposit
        </CardTitle>
        <CardDescription>
          Submit a notification once you've transferred funds to your Kumbra Capital account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Sent *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference (Optional)</Label>
            <Textarea
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Enter any reference or transaction details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Upload Receipt / Proof of Transfer</Label>
            <div className="flex items-center gap-4">
              <Input
                id="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <span className="text-sm text-muted-foreground">{file.name}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Submitting this form does NOT credit funds to your account</li>
              <li>Funds will be credited only after verification by our team</li>
              <li>Verification typically takes 1-3 business days</li>
              <li>You will receive a notification once funds are credited</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Deposit Notification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
