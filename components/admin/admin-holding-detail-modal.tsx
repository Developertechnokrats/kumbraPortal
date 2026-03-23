'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { CompanyLogo } from '@/components/ui/company-logo';

interface AdminHoldingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: any;
  onSuccess: () => void;
}

export function AdminHoldingDetailModal({ open, onOpenChange, holding, onSuccess }: AdminHoldingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cashflows, setCashflows] = useState<any[]>([]);
  const [loadingCashflows, setLoadingCashflows] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [changes, setChanges] = useState<string[]>([]);

  useEffect(() => {
    if (open && holding) {
      setEditedData({
        face_or_units: holding.face_or_units,
        price: holding.price,
        cost_basis: holding.cost_basis,
        current_value: holding.current_value,
        accrued_interest: holding.accrued_interest || 0,
        unrealised_pl: holding.unrealised_pl || 0,
        start_date: holding.start_date,
        term_months: holding.term_months,
        maturity_date: holding.maturity_date,
        payment_frequency: holding.payment_frequency,
        status: holding.status,
      });
      loadCashflows();
    }
  }, [open, holding]);

  const loadCashflows = async () => {
    if (!holding?.id) return;

    try {
      setLoadingCashflows(true);
      const { data, error } = await supabase
        .from('cashflows')
        .select('*')
        .eq('holding_id', holding.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setCashflows(data || []);
    } catch (error) {
      console.error('Error loading cashflows:', error);
    } finally {
      setLoadingCashflows(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({
      face_or_units: holding.face_or_units,
      price: holding.price,
      cost_basis: holding.cost_basis,
      current_value: holding.current_value,
      accrued_interest: holding.accrued_interest || 0,
      unrealised_pl: holding.unrealised_pl || 0,
      start_date: holding.start_date,
      term_months: holding.term_months,
      maturity_date: holding.maturity_date,
      payment_frequency: holding.payment_frequency,
      status: holding.status,
    });
  };

  const calculateChanges = () => {
    const changesList: string[] = [];

    if (Number(editedData.face_or_units) !== Number(holding.face_or_units)) {
      changesList.push(`Units/Face Value: ${holding.face_or_units} → ${editedData.face_or_units}`);
    }
    if (Number(editedData.price) !== Number(holding.price)) {
      changesList.push(`Price: ${holding.price} → ${editedData.price}`);
    }
    if (Number(editedData.cost_basis) !== Number(holding.cost_basis)) {
      changesList.push(`Cost Basis: ${holding.cost_basis} → ${editedData.cost_basis}`);
    }
    if (Number(editedData.current_value) !== Number(holding.current_value)) {
      changesList.push(`Current Value: ${holding.current_value} → ${editedData.current_value}`);
    }
    if (Number(editedData.accrued_interest) !== Number(holding.accrued_interest || 0)) {
      changesList.push(`Accrued Interest: ${holding.accrued_interest || 0} → ${editedData.accrued_interest}`);
    }
    if (editedData.start_date !== holding.start_date) {
      changesList.push(`Start Date: ${holding.start_date} → ${editedData.start_date}`);
    }
    if (editedData.term_months !== holding.term_months) {
      changesList.push(`Term (months): ${holding.term_months || 'N/A'} → ${editedData.term_months || 'N/A'}`);
    }
    if (editedData.maturity_date !== holding.maturity_date) {
      changesList.push(`Maturity Date: ${holding.maturity_date || 'N/A'} → ${editedData.maturity_date || 'N/A'}`);
    }
    if (editedData.payment_frequency !== holding.payment_frequency) {
      changesList.push(`Payment Frequency: ${holding.payment_frequency || 'N/A'} → ${editedData.payment_frequency || 'N/A'}`);
    }
    if (editedData.status !== holding.status) {
      changesList.push(`Status: ${holding.status} → ${editedData.status}`);
    }

    return changesList;
  };

  const handleSaveChanges = () => {
    const changesList = calculateChanges();

    if (changesList.length === 0) {
      alert('No changes detected');
      return;
    }

    setChanges(changesList);
    setShowConfirmation(true);
  };

  const handleConfirmChanges = async () => {
    try {
      setProcessing(true);

      const updateData: any = {
        face_or_units: Number(editedData.face_or_units),
        price: Number(editedData.price),
        cost_basis: Number(editedData.cost_basis),
        current_value: Number(editedData.current_value),
        accrued_interest: Number(editedData.accrued_interest),
        unrealised_pl: Number(editedData.current_value) - Number(editedData.cost_basis),
        start_date: editedData.start_date,
        term_months: editedData.term_months ? Number(editedData.term_months) : null,
        maturity_date: editedData.maturity_date || null,
        payment_frequency: editedData.payment_frequency || null,
        status: editedData.status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('holdings')
        .update(updateData)
        .eq('id', holding.id);

      if (error) throw error;

      setShowConfirmation(false);
      setIsEditing(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating holding:', error);
      alert('Error updating holding: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!holding) return null;

  const instrument = holding.instrument || {};

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CompanyLogo
                  issuerName={instrument.issuer_name || 'Unknown'}
                  issuerDomain={instrument.issuer_domain}
                  customLogoUrl={instrument.metadata_json?.company_logo}
                  size="md"
                  variant="horizontal"
                />
                <div>
                  <DialogTitle>{instrument.issuer_name || 'Unknown Issuer'}</DialogTitle>
                  <DialogDescription>{instrument.asset_class || 'N/A'}</DialogDescription>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Holding
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="cashflows">Payment Schedule ({cashflows.length})</TabsTrigger>
              <TabsTrigger value="instrument">Instrument Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Position Details</CardTitle>
                  <CardDescription>Current holding information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Units / Face Value</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.face_or_units}
                          onChange={(e) => setEditedData({...editedData, face_or_units: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{Number(holding.face_or_units).toLocaleString('en-GB')}</div>
                      )}
                    </div>
                    <div>
                      <Label>Price</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.price}
                          onChange={(e) => setEditedData({...editedData, price: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{holding.currency} {Number(holding.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                    <div>
                      <Label>Cost Basis</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.cost_basis}
                          onChange={(e) => setEditedData({...editedData, cost_basis: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{holding.currency} {Number(holding.cost_basis).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                    <div>
                      <Label>Current Value</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.current_value}
                          onChange={(e) => setEditedData({...editedData, current_value: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{holding.currency} {Number(holding.current_value).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                    <div>
                      <Label>Accrued Interest</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.accrued_interest}
                          onChange={(e) => setEditedData({...editedData, accrued_interest: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{holding.currency} {Number(holding.accrued_interest || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
                      )}
                    </div>
                    <div>
                      <Label>Unrealised P/L</Label>
                      <div className={`text-lg font-medium ${Number(holding.unrealised_pl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(holding.unrealised_pl) >= 0 ? '+' : ''}
                        {holding.currency} {Number(holding.unrealised_pl).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dates & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.start_date}
                          onChange={(e) => setEditedData({...editedData, start_date: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{new Date(holding.start_date).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div>
                      <Label>Term (Months)</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedData.term_months || ''}
                          onChange={(e) => setEditedData({...editedData, term_months: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">{holding.term_months || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Maturity Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.maturity_date || ''}
                          onChange={(e) => setEditedData({...editedData, maturity_date: e.target.value})}
                        />
                      ) : (
                        <div className="text-lg font-medium">
                          {holding.maturity_date ? new Date(holding.maturity_date).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Payment Frequency</Label>
                      {isEditing ? (
                        <Select value={editedData.payment_frequency || ''} onValueChange={(v) => setEditedData({...editedData, payment_frequency: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="BIANNUAL">Biannual</SelectItem>
                            <SelectItem value="ANNUAL">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-lg font-medium">{holding.payment_frequency || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Status</Label>
                      {isEditing ? (
                        <Select value={editedData.status} onValueChange={(v) => setEditedData({...editedData, status: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                            <SelectItem value="MATURED">Matured</SelectItem>
                            <SelectItem value="SOLD">Sold</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={holding.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {holding.status}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <div className="text-lg font-medium">{holding.currency}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isEditing && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cashflows">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Schedule</CardTitle>
                  <CardDescription>Expected and actual payments for this holding</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingCashflows ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                  ) : cashflows.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Expected Amount</TableHead>
                          <TableHead className="text-right">Actual Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashflows.map((cf) => (
                          <TableRow key={cf.id}>
                            <TableCell>{new Date(cf.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{cf.type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {cf.currency} {Number(cf.expected_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              {cf.actual_amount
                                ? `${cf.currency} ${Number(cf.actual_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={cf.paid ? 'default' : 'secondary'}>
                                {cf.paid ? 'Paid' : 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No payment schedule found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instrument">
              <Card>
                <CardHeader>
                  <CardTitle>Instrument Information</CardTitle>
                  <CardDescription>Details about the underlying instrument</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Issuer Name</Label>
                      <div className="text-lg font-medium">{instrument.issuer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Asset Class</Label>
                      <div className="text-lg font-medium">{instrument.asset_class || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Symbol</Label>
                      <div className="text-lg font-medium">{instrument.symbol || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>ISIN</Label>
                      <div className="text-lg font-medium">{instrument.isin || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <div className="text-lg font-medium">{instrument.currency || 'N/A'}</div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant={instrument.is_active ? 'default' : 'secondary'}>
                        {instrument.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {instrument.metadata_json && Object.keys(instrument.metadata_json).length > 0 && (
                    <div className="mt-4">
                      <Label>Additional Metadata</Label>
                      <div className="mt-2 bg-muted p-4 rounded-lg overflow-auto">
                        <pre className="text-xs">{JSON.stringify(instrument.metadata_json, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <AlertDialogTitle>Confirm Changes to Client Holding</AlertDialogTitle>
                <AlertDialogDescription>
                  These changes will be immediately visible in the client's account. Please review carefully.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="my-4">
            <div className="text-sm font-medium mb-2">Changes to be made:</div>
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              {changes.map((change, index) => (
                <div key={index} className="text-sm">
                  {change}
                </div>
              ))}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChanges} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
