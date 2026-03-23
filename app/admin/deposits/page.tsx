'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, DollarSign, Loader2, AlertCircle, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';

interface DepositNotification {
  id: string;
  client_id: string;
  client_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string | null;
  receipt_url: string | null;
  status: string;
  rejected_reason: string | null;
  created_at: string;
  approved_at: string | null;
}

interface CashAccount {
  client_id: string;
  currency: string;
  balance: number;
}

export default function DepositsPage() {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<DepositNotification[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositNotification | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    try {
      setLoading(true);

      const { data: clientsData } = await (supabase as any)
        .from('clients')
        .select('id, user_id')
        .eq('archived', false);

      const clientIds = (clientsData || []).map((c: any) => c.user_id);

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.name]));
      const clientIdToName = new Map((clientsData || []).map((c: any) => [c.id, profileMap.get(c.user_id) || 'Unknown']));

      const { data: depositsData, error } = await (supabase as any)
        .from('deposit_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const depositsWithNames: DepositNotification[] = (depositsData || []).map((d: any) => ({
        ...d,
        client_name: clientIdToName.get(d.client_id) || 'Unknown'
      }));

      setDeposits(depositsWithNames);

      const { data: accountsData } = await (supabase as any)
        .from('client_cash_accounts')
        .select('client_id, currency, balance');

      setAccounts(accountsData || []);

    } catch (error) {
      console.error('Error loading deposits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deposit data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBalance = (clientId: string, currency: string): number => {
    const account = accounts.find(a => a.client_id === clientId && a.currency === currency);
    return account?.balance || 0;
  };

  const getLatestLedgerBalance = async (clientId: string, currency: string): Promise<number> => {
    const { data } = await (supabase as any)
      .from('cash_ledger')
      .select('running_balance')
      .eq('client_id', clientId)
      .eq('currency', currency)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.running_balance || 0;
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentBalance = await getLatestLedgerBalance(selectedDeposit.client_id, selectedDeposit.currency);
      const newBalance = currentBalance + selectedDeposit.amount;

      const ledgerEntry = {
        client_id: selectedDeposit.client_id,
        transaction_type: 'DEPOSIT',
        currency: selectedDeposit.currency,
        amount: selectedDeposit.amount,
        running_balance: newBalance,
        status: 'APPROVED',
        reference: selectedDeposit.reference || `Deposit via ${selectedDeposit.payment_method}`,
        notes: `Approved deposit notification`,
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      const { data: ledger, error: ledgerError } = await (supabase as any)
        .from('cash_ledger')
        .insert(ledgerEntry)
        .select()
        .single();

      if (ledgerError) throw ledgerError;

      const { error: accountError } = await (supabase as any)
        .from('client_cash_accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('client_id', selectedDeposit.client_id)
        .eq('currency', selectedDeposit.currency);

      if (accountError) throw accountError;

      const { error: notificationError } = await (supabase as any)
        .from('deposit_notifications')
        .update({
          status: 'APPROVED',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          ledger_entry_id: ledger.id,
        })
        .eq('id', selectedDeposit.id);

      if (notificationError) throw notificationError;

      toast({
        title: 'Deposit Approved',
        description: `Credited ${formatCurrency(selectedDeposit.amount, selectedDeposit.currency)} to ${selectedDeposit.client_name}. New balance: ${formatCurrency(newBalance, selectedDeposit.currency)}`,
      });

      setSelectedDeposit(null);
      setActionType(null);
      loadDeposits();
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast({
        title: 'Approval Failed',
        description: error.message || 'Error approving deposit',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('deposit_notifications')
        .update({
          status: 'REJECTED',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: rejectionReason,
        })
        .eq('id', selectedDeposit.id);

      if (error) throw error;

      toast({
        title: 'Deposit Rejected',
        description: 'The deposit has been rejected',
      });

      setSelectedDeposit(null);
      setActionType(null);
      setRejectionReason('');
      loadDeposits();
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Error rejecting deposit',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'PENDING');
  const approvedDeposits = deposits.filter(d => d.status === 'APPROVED');
  const rejectedDeposits = deposits.filter(d => d.status === 'REJECTED');

  const pendingValue = pendingDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const todayApproved = approvedDeposits.filter(d => {
    const today = new Date().toDateString();
    return d.approved_at && new Date(d.approved_at).toDateString() === today;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deposit Management</h1>
          <p className="text-muted-foreground mt-1">Review and approve client deposit notifications</p>
        </div>
        <Button variant="outline" onClick={loadDeposits}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingDeposits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(pendingValue, 'USD')} total value
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{todayApproved.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(todayApproved.reduce((s, d) => s + d.amount, 0), 'USD')} credited
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{approvedDeposits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedDeposits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingDeposits.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingDeposits.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Deposits</CardTitle>
              <CardDescription>Deposits awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingDeposits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending deposits</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell>{format(new Date(deposit.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{deposit.client_name}</TableCell>
                        <TableCell className="font-bold text-green-600">+{formatCurrency(deposit.amount, deposit.currency)}</TableCell>
                        <TableCell><Badge variant="outline">{deposit.currency}</Badge></TableCell>
                        <TableCell>{deposit.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">{deposit.reference || '-'}</TableCell>
                        <TableCell>
                          {deposit.receipt_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={deposit.receipt_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setActionType('approve');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setActionType('reject');
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
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
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Deposits</CardTitle>
              <CardDescription>Successfully processed deposits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Date Approved</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedDeposits.slice(0, 20).map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{format(new Date(deposit.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{deposit.approved_at ? format(new Date(deposit.approved_at), 'dd MMM yyyy HH:mm') : '-'}</TableCell>
                      <TableCell className="font-medium">{deposit.client_name}</TableCell>
                      <TableCell className="font-bold text-green-600">+{formatCurrency(deposit.amount, deposit.currency)}</TableCell>
                      <TableCell><Badge variant="outline">{deposit.currency}</Badge></TableCell>
                      <TableCell>{deposit.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Deposits</CardTitle>
              <CardDescription>Deposits that were declined</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedDeposits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No rejected deposits</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Rejection Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell>{format(new Date(deposit.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="font-medium">{deposit.client_name}</TableCell>
                        <TableCell>{formatCurrency(deposit.amount, deposit.currency)}</TableCell>
                        <TableCell><Badge variant="outline">{deposit.currency}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate text-red-600">{deposit.rejected_reason || '-'}</TableCell>
                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Deposits</CardTitle>
              <CardDescription>Complete deposit history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.slice(0, 50).map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{format(new Date(deposit.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{deposit.client_name}</TableCell>
                      <TableCell className={deposit.status === 'APPROVED' ? 'font-bold text-green-600' : ''}>
                        {deposit.status === 'APPROVED' ? '+' : ''}{formatCurrency(deposit.amount, deposit.currency)}
                      </TableCell>
                      <TableCell><Badge variant="outline">{deposit.currency}</Badge></TableCell>
                      <TableCell>{deposit.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">{deposit.reference || '-'}</TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedDeposit && !!actionType} onOpenChange={() => {
        setSelectedDeposit(null);
        setActionType(null);
        setRejectionReason('');
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'This will credit the client account and update their cash balance.'
                : 'Please provide a reason for rejecting this deposit.'}
            </DialogDescription>
          </DialogHeader>

          {selectedDeposit && (
            <div className="space-y-4">
              <Alert className={actionType === 'approve' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${actionType === 'approve' ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription>
                  {actionType === 'approve' ? (
                    <span>Are you sure? This will credit {formatCurrency(selectedDeposit.amount, selectedDeposit.currency)} to the client's {selectedDeposit.currency} account.</span>
                  ) : (
                    <span>Are you sure? The client will be notified their deposit was rejected.</span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <span className="font-medium">{selectedDeposit.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    +{formatCurrency(selectedDeposit.amount, selectedDeposit.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method:</span>
                  <span>{selectedDeposit.payment_method.replace('_', ' ')}</span>
                </div>
                {actionType === 'approve' && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-medium">
                        {formatCurrency(getCurrentBalance(selectedDeposit.client_id, selectedDeposit.currency), selectedDeposit.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">After Approval:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(getCurrentBalance(selectedDeposit.client_id, selectedDeposit.currency) + selectedDeposit.amount, selectedDeposit.currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Provide a reason for rejecting this deposit..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDeposit(null);
                setActionType(null);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              disabled={processing || (actionType === 'reject' && !rejectionReason.trim())}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
