'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Edit, Loader2, AlertCircle, DollarSign, Users, Building2, Settings, Clock, Tag, AlertTriangle, CheckCircle, XCircle, Percent, Package, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Image from 'next/image';
import { CompanyLogo } from '@/components/ui/company-logo';
import { useToast } from '@/hooks/use-toast';

type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'OUT_OF_ALLOCATION' | 'COMING_SOON';

export default function PreIPOSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [instruments, setInstruments] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null);
  const [affectedHoldings, setAffectedHoldings] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [activeDialogTab, setActiveDialogTab] = useState('pricing');
  const [formData, setFormData] = useState({
    new_price: '',
    market_price: '',
    min_investment: '',
    availability_status: 'AVAILABLE' as AvailabilityStatus,
    is_active: true,
    allocation_remaining: '',
    expected_ipo: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [instrumentsRes, pricesRes] = await Promise.all([
        supabase.from('instruments').select('*').eq('asset_class', 'PRE_IPO').eq('is_active', true).order('issuer_name'),
        supabase.from('price_updates').select('*, instrument:instruments!inner(issuer_name, symbol, metadata_json)').eq('instrument.asset_class', 'PRE_IPO').order('created_at', { ascending: false }).limit(50)
      ]);

      setInstruments(instrumentsRes.data || []);
      setPriceHistory(pricesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAffectedHoldingsCount = async (instrumentId: string) => {
    const { data } = await supabase
      .from('holdings')
      .select('id', { count: 'exact' })
      .eq('instrument_id', instrumentId)
      .in('status', ['ACTIVE', 'PENDING', 'PENDING_PAYMENT']);

    return data?.length || 0;
  };

  const handlePrepareUpdate = async () => {
    if (!formData.new_price) {
      alert('Please enter a new share price');
      return;
    }

    const count = await getAffectedHoldingsCount(selectedInstrument.id);
    setAffectedHoldings(count);
    setShowConfirmation(true);
  };

  const handleUpdatePrice = async () => {
    if (!selectedInstrument || !formData.new_price) {
      return;
    }

    try {
      setProcessing(true);

      const newPrice = parseFloat(formData.new_price);
      const oldPrice = selectedInstrument.metadata_json?.share_price || 0;

      await (supabase.from('instruments') as any).update({
        metadata_json: {
          ...selectedInstrument.metadata_json,
          share_price: newPrice,
          last_updated: new Date().toISOString()
        }
      }).eq('id', selectedInstrument.id);

      await (supabase.from('price_updates') as any).insert({
        instrument_id: selectedInstrument.id,
        old_price: oldPrice,
        new_price: newPrice,
        effective_date: new Date().toISOString().split('T')[0],
        updated_by: profile?.id,
        notes: formData.notes
      });

      const { data: holdings } = await supabase
        .from('holdings')
        .select('id, face_or_units, cost_basis')
        .eq('instrument_id', selectedInstrument.id)
        .in('status', ['ACTIVE', 'PENDING', 'PENDING_PAYMENT']);

      if (holdings && holdings.length > 0) {
        for (const holding of holdings) {
          const numShares = (holding as any).face_or_units;
          const newValue = numShares * newPrice;
          const unrealizedPL = newValue - (holding as any).cost_basis;

          await (supabase
            .from('holdings') as any)
            .update({
              price: newPrice,
              current_value: newValue,
              unrealized_pl: unrealizedPL
            })
            .eq('id', (holding as any).id);
        }
      }

      alert('Share price updated successfully!');
      setIsUpdateOpen(false);
      setShowConfirmation(false);
      setFormData({
        new_price: '',
        market_price: '',
        min_investment: '',
        availability_status: 'AVAILABLE',
        is_active: true,
        allocation_remaining: '',
        expected_ipo: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price');
    } finally {
      setProcessing(false);
    }
  };

  const openUpdateDialog = (instrument: any) => {
    setSelectedInstrument(instrument);
    setFormData({
      new_price: instrument.metadata_json?.share_price?.toString() || instrument.metadata_json?.price_per_share?.toString() || '',
      market_price: instrument.metadata_json?.market_price?.toString() || instrument.metadata_json?.share_price?.toString() || '',
      min_investment: instrument.metadata_json?.min_investment?.toString() || instrument.metadata_json?.minimum_investment?.toString() || '25000',
      availability_status: instrument.metadata_json?.availability_status || 'AVAILABLE',
      is_active: instrument.is_active !== false,
      allocation_remaining: instrument.metadata_json?.allocation_remaining?.toString() || '',
      expected_ipo: instrument.metadata_json?.expected_ipo || '',
      notes: ''
    });
    setActiveDialogTab('pricing');
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedInstrument) return;

    try {
      setProcessing(true);

      const newSalePrice = parseFloat(formData.new_price) || 0;
      const marketPrice = parseFloat(formData.market_price) || newSalePrice;
      const minInvestment = parseFloat(formData.min_investment) || 25000;
      const oldPrice = selectedInstrument.metadata_json?.share_price || selectedInstrument.metadata_json?.price_per_share || 0;

      const updatedMetadata = {
        ...selectedInstrument.metadata_json,
        share_price: newSalePrice,
        price_per_share: newSalePrice,
        market_price: marketPrice,
        min_investment: minInvestment,
        minimum_investment: minInvestment,
        availability_status: formData.availability_status,
        allocation_remaining: formData.allocation_remaining ? parseInt(formData.allocation_remaining) : null,
        expected_ipo: formData.expected_ipo || selectedInstrument.metadata_json?.expected_ipo,
        last_updated: new Date().toISOString()
      };

      await (supabase.from('instruments') as any).update({
        metadata_json: updatedMetadata,
        is_active: formData.is_active
      }).eq('id', selectedInstrument.id);

      if (newSalePrice !== oldPrice && oldPrice > 0) {
        await (supabase.from('price_updates') as any).insert({
          instrument_id: selectedInstrument.id,
          old_price: oldPrice,
          new_price: newSalePrice,
          effective_date: new Date().toISOString().split('T')[0],
          updated_by: profile?.id,
          notes: formData.notes || `Price updated. Status: ${formData.availability_status}`
        });

        const { data: holdings } = await supabase
          .from('holdings')
          .select('id, face_or_units, cost_basis')
          .eq('instrument_id', selectedInstrument.id)
          .in('status', ['ACTIVE', 'PENDING', 'PENDING_PAYMENT']);

        if (holdings && holdings.length > 0) {
          for (const holding of holdings) {
            const numShares = (holding as any).face_or_units;
            const newValue = numShares * newSalePrice;
            const unrealizedPL = newValue - (holding as any).cost_basis;

            await (supabase.from('holdings') as any)
              .update({
                price: newSalePrice,
                current_value: newValue,
                unrealized_pl: unrealizedPL
              })
              .eq('id', (holding as any).id);
          }
        }
      }

      toast({
        title: 'Settings Updated',
        description: `${selectedInstrument.symbol} settings have been saved successfully.`,
      });

      setIsSettingsOpen(false);
      setFormData({
        new_price: '',
        market_price: '',
        min_investment: '',
        availability_status: 'AVAILABLE',
        is_active: true,
        allocation_remaining: '',
        expected_ipo: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getAvailabilityBadge = (status: AvailabilityStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case 'LIMITED':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Limited Supply</Badge>;
      case 'OUT_OF_ALLOCATION':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Out of Allocation</Badge>;
      case 'COMING_SOON':
        return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"><Clock className="h-3 w-3 mr-1" />Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pre-IPO Instruments</CardTitle>
              <CardDescription>
                Manage pricing, availability, and minimum investments for pre-IPO companies.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {instruments.map((instrument) => {
              const salePrice = instrument.metadata_json?.share_price || instrument.metadata_json?.price_per_share || 0;
              const marketPrice = instrument.metadata_json?.market_price || salePrice;
              const discount = marketPrice > salePrice ? ((marketPrice - salePrice) / marketPrice * 100) : 0;
              const sector = instrument.metadata_json?.sector || 'Technology';
              const valuation = instrument.metadata_json?.valuation || 0;
              const minInvestment = instrument.metadata_json?.min_investment || instrument.metadata_json?.minimum_investment || 25000;
              const availabilityStatus = instrument.metadata_json?.availability_status || 'AVAILABLE';

              return (
                <Card key={instrument.id} className={`border-2 hover:border-primary/50 transition-colors ${!instrument.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-100 flex items-center justify-center overflow-hidden border">
                        {instrument.metadata_json?.company_logo ? (
                          <Image
                            src={instrument.metadata_json.company_logo}
                            alt={instrument.issuer_name}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{instrument.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{sector}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getAvailabilityBadge(availabilityStatus)}
                      {!instrument.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Sale Price</p>
                        <p className="font-bold text-blue-600">{formatCurrency(salePrice, 'USD')}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Market Price</p>
                        <p className="font-bold">{formatCurrency(marketPrice, 'USD')}</p>
                      </div>
                    </div>

                    {discount > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center gap-1">
                          <Tag className="h-3 w-3" />
                          {discount.toFixed(1)}% Discount Available
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5 text-sm border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Investment</span>
                        <span className="font-medium">{formatCurrency(minInvestment, 'USD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valuation</span>
                        <span className="font-medium">${(valuation / 1000000000).toFixed(1)}B</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected IPO</span>
                        <span className="font-medium">{instrument.metadata_json?.expected_ipo || 'TBD'}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => openUpdateDialog(instrument)}
                      className="w-full"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Settings
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Price Updates</CardTitle>
          <CardDescription>History of share price changes</CardDescription>
        </CardHeader>
        <CardContent>
          {priceHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No price updates yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Old Price</TableHead>
                  <TableHead>New Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceHistory.map((update) => {
                  const change = update.new_price - update.old_price;
                  const changePercent = (change / update.old_price) * 100;
                  const instrument = update.instrument as any;

                  return (
                    <TableRow key={update.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(update.created_at).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{instrument.symbol}</p>
                          <p className="text-xs text-muted-foreground">{instrument.issuer_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(update.old_price, 'USD')}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(update.new_price, 'USD')}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
                          <span className="font-semibold">
                            {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {update.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedInstrument?.metadata_json?.company_logo && (
                <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                  <Image
                    src={selectedInstrument.metadata_json.company_logo}
                    alt={selectedInstrument?.issuer_name || ''}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              )}
              <div>
                <span>{selectedInstrument?.symbol}</span>
                <p className="text-sm font-normal text-muted-foreground">{selectedInstrument?.issuer_name}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Configure pricing, availability, and investment requirements
            </DialogDescription>
          </DialogHeader>

          {selectedInstrument && (
            <Tabs value={activeDialogTab} onValueChange={setActiveDialogTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pricing">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="availability">
                  <Package className="h-4 w-4 mr-2" />
                  Availability
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Sale Price (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sale_price"
                        type="number"
                        step="0.01"
                        value={formData.new_price}
                        onChange={(e) => setFormData({ ...formData, new_price: e.target.value })}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">The price clients pay per share</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="market_price">Market Price (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="market_price"
                        type="number"
                        step="0.01"
                        value={formData.market_price}
                        onChange={(e) => setFormData({ ...formData, market_price: e.target.value })}
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Current market valuation per share</p>
                  </div>
                </div>

                {parseFloat(formData.market_price) > parseFloat(formData.new_price) && (
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span className="font-semibold">
                        {((parseFloat(formData.market_price) - parseFloat(formData.new_price)) / parseFloat(formData.market_price) * 100).toFixed(1)}% Discount
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">from market price</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="min_investment">Minimum Investment (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="min_investment"
                      type="number"
                      step="1000"
                      value={formData.min_investment}
                      onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                      placeholder="25000"
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum amount required to invest</p>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Availability Status</Label>
                  <Select
                    value={formData.availability_status}
                    onValueChange={(v) => setFormData({ ...formData, availability_status: v as AvailabilityStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Available
                        </div>
                      </SelectItem>
                      <SelectItem value="LIMITED">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Limited Supply
                        </div>
                      </SelectItem>
                      <SelectItem value="OUT_OF_ALLOCATION">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Out of Allocation
                        </div>
                      </SelectItem>
                      <SelectItem value="COMING_SOON">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Coming Soon
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.availability_status === 'LIMITED' && (
                  <div className="space-y-2">
                    <Label htmlFor="allocation">Remaining Allocation (shares)</Label>
                    <Input
                      id="allocation"
                      type="number"
                      value={formData.allocation_remaining}
                      onChange={(e) => setFormData({ ...formData, allocation_remaining: e.target.value })}
                      placeholder="Enter remaining shares"
                    />
                    <p className="text-xs text-muted-foreground">Number of shares still available for purchase</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="expected_ipo">Expected IPO</Label>
                  <Input
                    id="expected_ipo"
                    value={formData.expected_ipo}
                    onChange={(e) => setFormData({ ...formData, expected_ipo: e.target.value })}
                    placeholder="e.g., Q2 2025, 2025-2026"
                  />
                  <p className="text-xs text-muted-foreground">Expected IPO timeframe shown to clients</p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Show this instrument to clients</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Update Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Reason for changes (optional)..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Notes will be recorded in the price update history</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
