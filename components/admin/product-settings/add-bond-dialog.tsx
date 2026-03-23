'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface AddBondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBondDialog({ open, onOpenChange, onSuccess }: AddBondDialogProps) {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    isin: '',
    issuerName: '',
    bondName: '',
    description: '',
    currency: 'EUR',
    couponRate: '',
    rating: 'A',
    minInvestment: '50000',
    paymentFrequency: 'Semi-Annual',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.isin || !formData.issuerName || !formData.couponRate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      let logoUrl = '';

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `bond-logos/${formData.isin.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('client-documents')
            .getPublicUrl(fileName);
          logoUrl = urlData.publicUrl;
        }
      }

      const metadataJson = {
        name: formData.bondName || `${formData.issuerName} Bond`,
        description: formData.description || `Corporate bond issued by ${formData.issuerName}`,
        coupon_rate: parseFloat(formData.couponRate),
        rating: formData.rating,
        min_investment: parseInt(formData.minInvestment),
        payment_frequency: formData.paymentFrequency,
        currency_options: [formData.currency],
        term_options: [1, 2, 3, 5],
        company_logo: logoUrl || null,
      };

      const couponScheduleJson = {
        frequency_options: [
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'semi-annual', label: 'Semi-Annual' },
          { value: 'annual', label: 'Annual' },
        ],
        payment_dates: [],
      };

      const { error } = await (supabase as any)
        .from('instruments')
        .insert({
          isin: formData.isin,
          issuer_name: formData.issuerName,
          symbol: formData.isin.substring(0, 6),
          asset_class: 'FIXED_INCOME',
          currency: formData.currency,
          is_active: true,
          metadata_json: metadataJson,
          coupon_schedule_json: couponScheduleJson,
        });

      if (error) throw error;

      toast.success('Bond added successfully');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding bond:', error);
      toast.error(error.message || 'Failed to add bond');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      isin: '',
      issuerName: '',
      bondName: '',
      description: '',
      currency: 'EUR',
      couponRate: '',
      rating: 'A',
      minInvestment: '50000',
      paymentFrequency: 'Semi-Annual',
    });
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Bond</DialogTitle>
          <DialogDescription>
            Add a new corporate bond to the investment catalogue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="isin">ISIN *</Label>
              <Input
                id="isin"
                placeholder="e.g., GB0031348658"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">International Securities Identification Number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuerName">Issuer Name *</Label>
              <Input
                id="issuerName"
                placeholder="e.g., Barclays PLC"
                value={formData.issuerName}
                onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bondName">Bond Name</Label>
            <Input
              id="bondName"
              placeholder="e.g., Barclays Senior Notes 2028"
              value={formData.bondName}
              onChange={(e) => setFormData({ ...formData, bondName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the bond..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponRate">Coupon Rate (%) *</Label>
              <Input
                id="couponRate"
                type="number"
                step="0.01"
                placeholder="e.g., 5.25"
                value={formData.couponRate}
                onChange={(e) => setFormData({ ...formData, couponRate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Credit Rating</Label>
              <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AAA">AAA</SelectItem>
                  <SelectItem value="AA+">AA+</SelectItem>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="AA-">AA-</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="BBB+">BBB+</SelectItem>
                  <SelectItem value="BBB">BBB</SelectItem>
                  <SelectItem value="BBB-">BBB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minInvestment">Minimum Investment</Label>
              <Input
                id="minInvestment"
                type="number"
                placeholder="50000"
                value={formData.minInvestment}
                onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentFrequency">Payment Frequency</Label>
              <Select value={formData.paymentFrequency} onValueChange={(v) => setFormData({ ...formData, paymentFrequency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{logoFile?.name}</p>
                    <p className="text-xs text-muted-foreground">{logoFile?.size ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeLogo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload logo</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After adding the bond, you can configure additional settings like term options, payment dates, and available currencies from the bond settings page.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !formData.isin || !formData.issuerName || !formData.couponRate}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Bond...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Add Bond
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
