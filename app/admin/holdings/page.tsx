'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, Loader2, AlertCircle, RefreshCw, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { FundPendingInvestmentDialog } from '@/components/admin/fund-pending-investment-dialog';
import { CompanyLogo } from '@/components/ui/company-logo';

interface Holding {
  id: string;
  client_id: string;
  instrument_id: string;
  currency: string;
  face_or_units: number;
  price: number;
  cost_basis: number;
  current_value: number;
  unrealised_pl: number;
  status: string;
  start_date: string;
  client: { profile: { name: string } };
  instrument: {
    issuer_name: string;
    issuer_domain?: string;
    asset_class: string;
    metadata_json: any;
  };
}

export default function HoldingsPage() {
  const { profile } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [cashBalances, setCashBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [selectedClientForFunding, setSelectedClientForFunding] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    instrument_id: '',
    currency: 'AUD',
    face_or_units: '',
    price: '',
    cost_basis: '',
    current_value: '',
    start_date: new Date().toISOString().split('T')[0],
    term_months: '12'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [clientsRes, instrumentsRes, holdingsRes, cashBalancesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, user_id, profile:profiles!clients_user_id_fkey(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('instruments')
          .select('*')
          .eq('is_active', true)
          .order('asset_class, issuer_name'),
        supabase
          .from('holdings')
          .select(`
            *,
            client:clients!inner(
              id,
              user_id,
              profile:profiles!clients_user_id_fkey(name)
            ),
            instrument:instruments!inner(issuer_name, issuer_domain, asset_class, metadata_json)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('cash_balances')
          .select('*')
      ]);

      console.log('Clients loaded:', clientsRes.data?.length || 0);
      console.log('Instruments loaded:', instrumentsRes.data?.length || 0);
      console.log('Holdings loaded:', holdingsRes.data?.length || 0);

      setClients(clientsRes.data || []);
      setInstruments(instrumentsRes.data || []);
      setHoldings(holdingsRes.data as any || []);
      setCashBalances(cashBalancesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async () => {
    if (!formData.client_id || !formData.instrument_id || !formData.cost_basis) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);

      const instrument = instruments.find(i => i.id === formData.instrument_id);
      const client = clients.find(c => c.id === formData.client_id);

      const costBasis = parseFloat(formData.cost_basis);
      const currentValue = parseFloat(formData.current_value) || costBasis;

      const { data: cashBalance } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('client_id', formData.client_id)
        .eq('currency', formData.currency)
        .maybeSingle();

      const availableBalance = Number((cashBalance as any)?.balance || 0);

      if (availableBalance < costBasis) {
        alert(`Insufficient funds. Available: ${formatCurrency(availableBalance, formData.currency)}, Required: ${formatCurrency(costBasis, formData.currency)}`);
        setProcessing(false);
        return;
      }

      const maturityDate = new Date(formData.start_date);
      maturityDate.setMonth(maturityDate.getMonth() + parseInt(formData.term_months));

      const { error: holdingError } = await (supabase.from('holdings') as any).insert({
        client_id: formData.client_id,
        instrument_id: formData.instrument_id,
        currency: formData.currency,
        face_or_units: parseFloat(formData.face_or_units),
        price: parseFloat(formData.price),
        cost_basis: costBasis,
        current_value: currentValue,
        unrealised_pl: currentValue - costBasis,
        status: 'ACTIVE',
        start_date: formData.start_date,
        term_months: parseInt(formData.term_months),
        maturity_date: instrument.asset_class === 'FIXED_INCOME' ? maturityDate.toISOString().split('T')[0] : null,
        payment_frequency: instrument.coupon_schedule_json?.frequency || null
      });

      if (holdingError) throw holdingError;

      const newBalance = availableBalance - costBasis;
      await (supabase.from('cash_balances') as any).upsert({
        client_id: formData.client_id,
        currency: formData.currency,
        balance: newBalance
      }, { onConflict: 'client_id,currency' });

      await (supabase.from('transactions') as any).insert({
        client_id: formData.client_id,
        type: 'TRADE_EXECUTION',
        currency: formData.currency,
        amount: -costBasis,
        status: 'COMPLETED',
        created_by: profile?.id,
        metadata_json: {
          instrument: instrument.issuer_name,
          units: formData.face_or_units
        }
      });

      alert('Holding added successfully!');
      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error adding holding:', error);
      alert('Error adding holding: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditHolding = async () => {
    if (!selectedHolding) return;

    try {
      setProcessing(true);

      const currentValue = parseFloat(formData.current_value);
      const unrealisedPL = currentValue - selectedHolding.cost_basis;

      await (supabase.from('holdings') as any).update({
        current_value: currentValue,
        unrealised_pl: unrealisedPL
      }).eq('id', selectedHolding.id);

      alert('Holding updated successfully!');
      setIsEditOpen(false);
      setSelectedHolding(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating holding:', error);
      alert('Error updating holding: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteHolding = async (holding: Holding) => {
    if (!confirm(`Delete holding for ${holding.client.profile.name}? This will return ${formatCurrency(holding.current_value, holding.currency)} to cash.`)) {
      return;
    }

    try {
      await (supabase.from('holdings') as any).update({ status: 'CLOSED' }).eq('id', holding.id);

      const { data: cashBalance } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('client_id', holding.client_id)
        .eq('currency', holding.currency)
        .maybeSingle();

      const currentBalance = Number((cashBalance as any)?.balance || 0);
      const newBalance = currentBalance + holding.current_value;

      await (supabase.from('cash_balances') as any).upsert({
        client_id: holding.client_id,
        currency: holding.currency,
        balance: newBalance
      }, { onConflict: 'client_id,currency' });

      await (supabase.from('transactions') as any).insert({
        client_id: holding.client_id,
        type: 'TRADE_EXECUTION',
        currency: holding.currency,
        amount: holding.current_value,
        status: 'COMPLETED',
        created_by: profile?.id,
        metadata_json: {
          action: 'CLOSE_POSITION',
          instrument: holding.instrument.issuer_name
        }
      });

      alert('Holding closed successfully!');
      loadData();
    } catch (error: any) {
      console.error('Error deleting holding:', error);
      alert('Error deleting holding: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      instrument_id: '',
      currency: 'GBP',
      face_or_units: '',
      price: '',
      cost_basis: '',
      current_value: '',
      start_date: new Date().toISOString().split('T')[0],
      term_months: '12'
    });
  };

  const filteredHoldings = holdings.filter(h =>
    h.client.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.instrument.issuer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeHoldings = holdings.filter(h => h.status === 'ACTIVE');
  const totalValue = activeHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const totalCost = activeHoldings.reduce((sum, h) => sum + h.cost_basis, 0);
  const totalPL = totalValue - totalCost;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holdings Management</h1>
          <p className="text-muted-foreground mt-1">Manage all client investments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Holding
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeHoldings.length}</div>
            <p className="text-xs text-muted-foreground">Across {clients.length} clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue, 'GBP')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost, 'GBP')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unrealised P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(totalPL, 'GBP')}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client or instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHoldings.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No holdings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Cost Basis</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Unrealised P/L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHoldings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell className="font-medium">{holding.client.profile.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          issuerName={holding.instrument.issuer_name}
                          issuerDomain={holding.instrument.issuer_domain}
                          customLogoUrl={holding.instrument.metadata_json?.company_logo}
                          size="sm"
                        />
                        <span>{holding.instrument.issuer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{holding.instrument.asset_class}</Badge></TableCell>
                    <TableCell>{holding.face_or_units.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(holding.cost_basis, holding.currency)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(holding.current_value, holding.currency)}</TableCell>
                    <TableCell className={holding.unrealised_pl >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {formatCurrency(holding.unrealised_pl, holding.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          holding.status === 'ACTIVE' ? 'default' :
                          holding.status === 'PENDING_PAYMENT' ? 'destructive' :
                          'secondary'
                        }
                        className={holding.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : ''}
                      >
                        {holding.status === 'PENDING_PAYMENT' ? 'PENDING PAYMENT' : holding.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {holding.status === 'PENDING_PAYMENT' ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedClientForFunding(holding.client_id);
                              setIsFundDialogOpen(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Fund
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedHolding(holding);
                              setFormData({
                                ...formData,
                                current_value: holding.current_value.toString()
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHolding(holding)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Holding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {clients.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>No clients found!</strong> Please create a client first before adding holdings.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{(c as any).profile.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instrument *</Label>
                <Select value={formData.instrument_id} onValueChange={(v) => setFormData({...formData, instrument_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.issuer_name} ({i.asset_class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <Label>Units/Face Value *</Label>
                <Input
                  type="number"
                  value={formData.face_or_units}
                  onChange={(e) => setFormData({...formData, face_or_units: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Unit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cost Basis *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_basis}
                  onChange={(e) => setFormData({...formData, cost_basis: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                  placeholder="Same as cost basis"
                />
              </div>
              <div className="space-y-2">
                <Label>Term (Months)</Label>
                <Input
                  type="number"
                  value={formData.term_months}
                  onChange={(e) => setFormData({...formData, term_months: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will automatically deduct the cost basis from the client's cash balance and create a transaction record.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleAddHolding} disabled={processing || clients.length === 0}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Holding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Holding Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedHolding && (
              <>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input value={selectedHolding.client.profile.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Instrument</Label>
                  <Input value={selectedHolding.instrument.issuer_name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Current Value *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Cost Basis:</strong> {formatCurrency(selectedHolding.cost_basis, selectedHolding.currency)}<br />
                    <strong>New P/L:</strong> {formatCurrency(parseFloat(formData.current_value || '0') - selectedHolding.cost_basis, selectedHolding.currency)}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedHolding(null); }} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleEditHolding} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Holding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedClientForFunding && (
        <FundPendingInvestmentDialog
          open={isFundDialogOpen}
          onOpenChange={setIsFundDialogOpen}
          clientId={selectedClientForFunding}
          pendingHoldings={holdings
            .filter(h => h.client_id === selectedClientForFunding && h.status === 'PENDING_PAYMENT')
            .map(h => ({
              id: h.id,
              instrument: {
                issuer_name: h.instrument.issuer_name,
                isin: h.instrument.metadata_json?.isin || 'N/A'
              },
              currency: h.currency,
              cost_basis: h.cost_basis,
              status: h.status
            }))}
          cashBalance={(() => {
            const balance = cashBalances.find(b => b.client_id === selectedClientForFunding && b.currency === 'GBP');
            return balance?.balance || 0;
          })()}
          baseCurrency="GBP"
          onSuccess={() => {
            setIsFundDialogOpen(false);
            setSelectedClientForFunding(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
