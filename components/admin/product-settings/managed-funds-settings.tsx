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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, Edit, Loader2, AlertCircle, DollarSign, Users } from 'lucide-react';
import { CompanyLogo } from '@/components/ui/company-logo';

export default function ManagedFundsSettings() {
  const { profile } = useAuth();
  const [instruments, setInstruments] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null);
  const [affectedHoldings, setAffectedHoldings] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    new_price: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [instrumentsRes, pricesRes] = await Promise.all([
        supabase.from('instruments').select('*').eq('asset_class', 'MANAGED_FUND').eq('is_active', true).order('issuer_name'),
        supabase.from('price_updates').select('*, instrument:instruments!inner(issuer_name, metadata_json)').order('created_at', { ascending: false }).limit(50)
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
      .in('status', ['ACTIVE', 'PENDING_PAYMENT']);

    return data?.length || 0;
  };

  const handlePrepareUpdate = async () => {
    if (!formData.new_price) {
      alert('Please enter a new price');
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
      const oldPrice = selectedInstrument.metadata_json?.current_nav || 1.00;

      await (supabase.from('instruments') as any).update({
        metadata_json: {
          ...selectedInstrument.metadata_json,
          current_nav: newPrice,
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
        .select('*')
        .eq('instrument_id', selectedInstrument.id)
        .in('status', ['ACTIVE', 'PENDING_PAYMENT']);

      if (holdings && holdings.length > 0) {
        for (const holding of holdings) {
          const priceChange = newPrice / oldPrice;
          const newValue = (holding as any).current_value * priceChange;
          const newPL = newValue - (holding as any).cost_basis;

          await (supabase.from('holdings') as any).update({
            current_value: newValue,
            unrealised_pl: newPL,
            price: newPrice
          }).eq('id', (holding as any).id);
        }
      }

      await (supabase.from('audit_logs') as any).insert({
        user_id: profile?.id,
        action: 'UPDATE_PRICE',
        entity_type: 'INSTRUMENT',
        entity_id: selectedInstrument.id,
        changes: {
          instrument: selectedInstrument.issuer_name,
          old_price: oldPrice,
          new_price: newPrice,
          affected_holdings: holdings?.length || 0
        }
      });

      alert(`Price updated successfully! ${holdings?.length || 0} client holdings updated.`);
      setShowConfirmation(false);
      setIsUpdateOpen(false);
      setSelectedInstrument(null);
      setFormData({ new_price: '', notes: '' });
      loadData();
    } catch (error: any) {
      console.error('Error updating price:', error);
      alert('Error updating price: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Managed Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instruments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price Updates Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {priceHistory.filter(p => {
                const today = new Date().toDateString();
                return new Date(p.created_at).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceHistory.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Managed Funds</CardTitle>
          <CardDescription>Update fund prices - changes will automatically reflect in all client holdings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : instruments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No managed funds configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {instruments.map((instrument) => (
                <Card key={instrument.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <CompanyLogo
                          issuerName={instrument.issuer_name}
                          issuerDomain={instrument.issuer_domain}
                          customLogoUrl={instrument.metadata_json?.company_logo}
                          size="lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{instrument.issuer_name}</h3>
                          <p className="text-sm text-muted-foreground">{instrument.metadata_json?.fund_name || 'Managed Fund'}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{instrument.metadata_json?.fund_type || 'Fund'}</Badge>
                            <Badge variant="secondary">{instrument.risk_rating || 'MEDIUM'} Risk</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Current NAV</p>
                          <div className="flex items-baseline gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <p className="text-3xl font-bold tracking-tight">{instrument.metadata_json?.current_nav?.toFixed(4) || '1.0000'}</p>
                          </div>
                          {instrument.metadata_json?.last_updated && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last updated: {new Date(instrument.metadata_json.last_updated).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={async () => {
                            setSelectedInstrument(instrument);
                            setFormData({
                              new_price: instrument.metadata_json?.current_nav?.toString() || '',
                              notes: ''
                            });
                            setIsUpdateOpen(true);
                          }}
                          size="lg"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update NAV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Update History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>Old Price</TableHead>
                <TableHead>New Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceHistory.map((update) => {
                const change = ((update.new_price - update.old_price) / update.old_price) * 100;
                return (
                  <TableRow key={update.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(update.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="font-medium">{(update.instrument as any).issuer_name}</TableCell>
                    <TableCell>{update.old_price?.toFixed(4) || '-'}</TableCell>
                    <TableCell className="font-bold">{update.new_price.toFixed(4)}</TableCell>
                    <TableCell>
                      <Badge variant={change >= 0 ? 'default' : 'destructive'} className={change >= 0 ? 'bg-emerald-100 text-emerald-700' : ''}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{update.notes || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Fund NAV Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInstrument && (
              <>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fund Name:</span>
                    <span className="font-medium">{selectedInstrument.issuer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fund Type:</span>
                    <span className="font-medium">{selectedInstrument.metadata_json?.fund_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current NAV:</span>
                    <span className="text-lg font-bold">{selectedInstrument.metadata_json?.current_nav?.toFixed(4) || '1.0000'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-nav">New NAV Price *</Label>
                  <Input
                    id="new-nav"
                    type="number"
                    step="0.0001"
                    value={formData.new_price}
                    onChange={(e) => setFormData({...formData, new_price: e.target.value})}
                    placeholder="Enter new NAV..."
                    className="text-lg font-medium"
                  />
                  {formData.new_price && selectedInstrument.metadata_json?.current_nav && (
                    <p className="text-sm text-muted-foreground">
                      Change: {((parseFloat(formData.new_price) - selectedInstrument.metadata_json.current_nav) / selectedInstrument.metadata_json.current_nav * 100).toFixed(2)}%
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Monthly NAV update, Market adjustment, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Important: Automatic Update
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This will automatically recalculate and update the current value of all client holdings for this fund based on the new NAV.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateOpen(false);
                setSelectedInstrument(null);
                setFormData({ new_price: '', notes: '' });
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handlePrepareUpdate} disabled={processing || !formData.new_price}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm NAV Price Update</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Are you sure you want to update the NAV for this fund?</p>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fund:</span>
                    <span className="font-medium">{selectedInstrument?.issuer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Old NAV:</span>
                    <span className="font-medium">{selectedInstrument?.metadata_json?.current_nav?.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">New NAV:</span>
                    <span className="font-bold text-lg">{parseFloat(formData.new_price).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Affected Holdings:
                    </span>
                    <span className="font-bold text-lg">{affectedHoldings}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    This action will update {affectedHoldings} client {affectedHoldings === 1 ? 'holding' : 'holdings'}. All client portfolio values will be recalculated immediately.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdatePrice} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
