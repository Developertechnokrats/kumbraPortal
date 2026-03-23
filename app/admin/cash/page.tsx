'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Wallet, AlertCircle, FileText, ExternalLink, ArrowDownCircle, ArrowUpCircle, Repeat, TrendingUp, Receipt, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';

interface ClientWithProfile {
  id: string;
  user_id: string;
  name: string;
}

interface CashAccount {
  id: string;
  currency: string;
  balance: number;
  client_id: string;
  client_name: string;
}

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
  created_at: string;
}

interface LedgerEntry {
  id: string;
  client_id: string;
  client_name: string;
  transaction_type: string;
  currency: string;
  amount: number;
  running_balance: number;
  status: string;
  reference: string | null;
  notes: string | null;
  fx_rate: number | null;
  fx_currency_from: string | null;
  fx_currency_to: string | null;
  created_at: string;
  approved_at: string | null;
}

export default function AdminCashManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositNotification[]>([]);
  const [allAccounts, setAllAccounts] = useState<CashAccount[]>([]);
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntry[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    deposit: DepositNotification | null;
    action: 'approve' | 'reject' | null;
  }>({ open: false, deposit: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await (supabase as any)
        .from('clients')
        .select('id, user_id')
        .eq('archived', false);

      if (clientsError) throw clientsError;

      const clientIds = (clientsData || []).map((c: any) => c.user_id);

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.name]));

      const clientsWithNames: ClientWithProfile[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        user_id: c.user_id,
        name: profileMap.get(c.user_id) || 'Unknown'
      }));

      setClients(clientsWithNames);

      const clientIdToName = new Map(clientsWithNames.map(c => [c.id, c.name]));

      const { data: accountsData, error: accountsError } = await (supabase as any)
        .from('client_cash_accounts')
        .select('*')
        .order('balance', { ascending: false });

      if (accountsError) throw accountsError;

      const accounts: CashAccount[] = (accountsData || []).map((a: any) => ({
        ...a,
        client_name: clientIdToName.get(a.client_id) || 'Unknown'
      }));

      setAllAccounts(accounts);

      const { data: depositsData, error: depositsError } = await (supabase as any)
        .from('deposit_notifications')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      const deposits: DepositNotification[] = (depositsData || []).map((d: any) => ({
        ...d,
        client_name: clientIdToName.get(d.client_id) || 'Unknown'
      }));

      setPendingDeposits(deposits);

      const { data: ledgerData, error: ledgerError } = await (supabase as any)
        .from('cash_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (ledgerError) throw ledgerError;

      const ledgerEntries: LedgerEntry[] = (ledgerData || []).map((l: any) => ({
        ...l,
        client_name: clientIdToName.get(l.client_id) || 'Unknown'
      }));

      setAllLedgerEntries(ledgerEntries);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cash management data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBalance = (clientId: string, currency: string): number => {
    const account = allAccounts.find(a => a.client_id === clientId && a.currency === currency);
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

  const handleApprove = async (deposit: DepositNotification) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentBalance = await getLatestLedgerBalance(deposit.client_id, deposit.currency);
      const newBalance = currentBalance + deposit.amount;

      const ledgerEntry = {
        client_id: deposit.client_id,
        transaction_type: 'DEPOSIT',
        currency: deposit.currency,
        amount: deposit.amount,
        running_balance: newBalance,
        status: 'APPROVED',
        reference: deposit.reference || `Deposit via ${deposit.payment_method}`,
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
        .eq('client_id', deposit.client_id)
        .eq('currency', deposit.currency);

      if (accountError) throw accountError;

      const { error: notificationError } = await (supabase as any)
        .from('deposit_notifications')
        .update({
          status: 'APPROVED',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          ledger_entry_id: ledger.id,
        })
        .eq('id', deposit.id);

      if (notificationError) throw notificationError;

      toast({
        title: 'Deposit Approved',
        description: `Successfully credited ${formatCurrency(deposit.amount, deposit.currency)} to ${deposit.client_name}. New balance: ${formatCurrency(newBalance, deposit.currency)}`,
      });

      setApprovalDialog({ open: false, deposit: null, action: null });
      loadData();
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve deposit',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (deposit: DepositNotification) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this deposit',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
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
        .eq('id', deposit.id);

      if (error) throw error;

      toast({
        title: 'Deposit Rejected',
        description: 'The deposit notification has been rejected',
      });

      setApprovalDialog({ open: false, deposit: null, action: null });
      setRejectionReason('');
      loadData();
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject deposit',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'FX_CONVERSION':
        return <Repeat className="h-4 w-4 text-blue-600" />;
      case 'INTEREST':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'INVESTMENT_FUNDING':
        return <Receipt className="h-4 w-4 text-purple-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const filteredLedger = allLedgerEntries.filter(e => {
    if (selectedClientId && e.client_id !== selectedClientId) return false;
    if (selectedCurrency && e.currency !== selectedCurrency) return false;
    return true;
  });

  const totalCashByGBP = allAccounts.filter(a => a.currency === 'GBP').reduce((sum, a) => sum + a.balance, 0);
  const totalCashByUSD = allAccounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.balance, 0);
  const totalCashByEUR = allAccounts.filter(a => a.currency === 'EUR').reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cash Management</h1>
          <p className="text-muted-foreground">
            Manage client cash accounts, approve deposits, and view all transactions
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingDeposits.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total GBP Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCashByGBP, 'GBP')}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total USD Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCashByUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total EUR Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCashByEUR, 'EUR')}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Deposits
            {pendingDeposits.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingDeposits.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts">All Cash Accounts</TabsTrigger>
          <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Deposit Approvals</CardTitle>
              <CardDescription>Review and approve client deposit notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDeposits.length === 0 ? (
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
                        <TableCell className="font-semibold text-green-600">+{formatCurrency(deposit.amount, deposit.currency)}</TableCell>
                        <TableCell><Badge variant="outline">{deposit.currency}</Badge></TableCell>
                        <TableCell className="text-sm">{deposit.payment_method.replace('_', ' ')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {deposit.reference || '-'}
                        </TableCell>
                        <TableCell>
                          {deposit.receipt_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={deposit.receipt_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-1" />
                                View
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setApprovalDialog({ open: true, deposit, action: 'approve' })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setApprovalDialog({ open: true, deposit, action: 'reject' })}
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

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>All Client Cash Accounts</CardTitle>
              <CardDescription>Overview of all client cash balances across currencies</CardDescription>
            </CardHeader>
            <CardContent>
              {allAccounts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cash accounts found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.client_name}</TableCell>
                        <TableCell><Badge variant="outline">{account.currency}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.balance, account.currency)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedClientId(account.client_id);
                              setSelectedCurrency(account.currency);
                              setActiveTab('ledger');
                            }}
                          >
                            View {account.currency} Ledger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Ledger</CardTitle>
                  <CardDescription>View detailed transaction history by client and currency</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={selectedClientId || 'ALL'} onValueChange={(val) => setSelectedClientId(val === 'ALL' ? '' : val)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCurrency || 'ALL'} onValueChange={(val) => setSelectedCurrency(val === 'ALL' ? '' : val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Currencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Currencies</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                  {(selectedClientId || selectedCurrency) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedClientId('');
                        setSelectedCurrency('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLedger.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">{entry.client_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(entry.transaction_type)}
                              <span className="text-sm">{entry.transaction_type.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.currency}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {entry.amount < 0 ? formatCurrency(Math.abs(entry.amount), entry.currency) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {entry.amount >= 0 ? formatCurrency(entry.amount, entry.currency) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.status === 'APPROVED' ? formatCurrency(entry.running_balance, entry.currency) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.status === 'APPROVED' ? 'default' : entry.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {entry.transaction_type === 'FX_CONVERSION' && entry.fx_rate ? (
                              <span>{entry.fx_currency_from} → {entry.fx_currency_to} @ {entry.fx_rate.toFixed(4)}</span>
                            ) : (
                              entry.reference || entry.notes || '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={approvalDialog.open} onOpenChange={(open) => {
        if (!open) {
          setApprovalDialog({ open: false, deposit: null, action: null });
          setRejectionReason('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.action === 'approve'
                ? 'This action will credit the client account and update their cash balance.'
                : 'Please provide a reason for rejecting this deposit notification.'}
            </DialogDescription>
          </DialogHeader>

          {approvalDialog.deposit && (
            <div className="space-y-4">
              <Alert className={approvalDialog.action === 'approve' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertCircle className={`h-4 w-4 ${approvalDialog.action === 'approve' ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription>
                  {approvalDialog.action === 'approve' ? (
                    <span>Are you sure you want to approve this deposit? This will credit the client's account.</span>
                  ) : (
                    <span>Are you sure you want to reject this deposit? The client will be notified.</span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <span className="font-medium">{approvalDialog.deposit.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-green-600">
                    +{formatCurrency(approvalDialog.deposit.amount, approvalDialog.deposit.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Method:</span>
                  <span>{approvalDialog.deposit.payment_method.replace('_', ' ')}</span>
                </div>
                {approvalDialog.action === 'approve' && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            getCurrentBalance(approvalDialog.deposit.client_id, approvalDialog.deposit.currency),
                            approvalDialog.deposit.currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">After Approval:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            getCurrentBalance(approvalDialog.deposit.client_id, approvalDialog.deposit.currency) + approvalDialog.deposit.amount,
                            approvalDialog.deposit.currency
                          )}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {approvalDialog.action === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejection..."
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setApprovalDialog({ open: false, deposit: null, action: null });
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            {approvalDialog.action === 'approve' ? (
              <Button
                onClick={() => approvalDialog.deposit && handleApprove(approvalDialog.deposit)}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Confirm Approval
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => approvalDialog.deposit && handleReject(approvalDialog.deposit)}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Confirm Rejection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
