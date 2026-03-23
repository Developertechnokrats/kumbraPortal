'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, Wallet, ArrowDownCircle, ArrowUpCircle, Building2, Plus, Trash2,
  CheckCircle2, Info, Copy, CheckCircle, Printer, AlertTriangle, Bell,
  TrendingUp, CreditCard, Banknote, ArrowRight, History, RefreshCw,
  Filter, Clock, ArrowDownRight, ArrowUpRight, Repeat, Receipt, Phone
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/format';
import { ConfirmPaymentDialog } from '@/components/portal/confirm-payment-dialog';
import { PrintPaymentInstructions } from '@/components/portal/print-payment-instructions';
import { RequestCallDialog } from '@/components/portal/request-call-dialog';
import { Separator } from '@/components/ui/separator';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface CashAccount {
  id: string;
  currency: string;
  balance: number;
}

interface CashLedgerEntry {
  id: string;
  transaction_type: string;
  currency: string;
  amount: number;
  running_balance: number;
  status: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  sortCode?: string;
  accountNumber: string;
  iban?: string;
  country: string;
  verified: boolean;
}

export default function CashManagementPage() {
  const { profile } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [ledger, setLedger] = useState<CashLedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    accountName: '',
    sortCode: '',
    accountNumber: '',
    iban: '',
    country: 'UK',
  });

  const [paymentDetails, setPaymentDetails] = useState<any>({});
  const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterTime, setFilterTime] = useState('all');

  const savedBankAccounts: BankAccount[] = [
    { id: '1', accountName: profile?.name || 'Account Holder', sortCode: '40-00-00', accountNumber: '****5678', country: 'UK', verified: true },
  ];

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: clientData, error: clientError } = await (supabase as any)
        .from('clients')
        .select('id, payment_reference_code, payment_account_name, payment_sort_code, payment_account_number, payment_iban, payment_swift_bic, payment_bank_address, base_currency')
        .eq('user_id', user.id)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client profile not found');

      const client = clientData as any;
      setClientId(client.id);
      setPaymentDetails({
        payment_reference_code: client.payment_reference_code || 'N/A',
        payment_account_name: client.payment_account_name || '',
        payment_sort_code: client.payment_sort_code || '',
        payment_account_number: client.payment_account_number || '',
        payment_iban: client.payment_iban || '',
        payment_swift_bic: client.payment_swift_bic || '',
        payment_bank_address: client.payment_bank_address || '',
        base_currency: client.base_currency || 'GBP',
      });

      const [accountsRes, ledgerRes, holdingsRes] = await Promise.all([
        (supabase as any).from('client_cash_accounts').select('*').eq('client_id', client.id).order('currency'),
        (supabase as any).from('cash_ledger').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
        (supabase as any).from('holdings')
          .select('id, cost_basis, currency, status, created_at, instrument:instruments(issuer_name, asset_class)')
          .eq('client_id', client.id)
          .in('status', ['PENDING', 'PENDING_PAYMENT'])
          .order('created_at', { ascending: false })
      ]);

      setCashAccounts(accountsRes.data || []);
      setLedger(ledgerRes.data || []);
      setPendingInvestments(holdingsRes.data || []);

      if (accountsRes.data?.length > 0 && !withdrawCurrency) {
        setWithdrawCurrency(accountsRes.data[0].currency);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = useMemo(() => {
    return cashAccounts.reduce((sum, acc) => {
      if (acc.currency === 'GBP') return sum + acc.balance * 1.27;
      if (acc.currency === 'EUR') return sum + acc.balance * 1.10;
      return sum + acc.balance;
    }, 0);
  }, [cashAccounts]);

  const totalAmountDue = pendingInvestments.reduce((sum, inv) => sum + Number(inv.cost_basis), 0);

  const recentTransactions = useMemo(() => {
    return ledger.filter(e => e.status === 'APPROVED').slice(0, 5);
  }, [ledger]);

  const filteredLedger = useMemo(() => {
    let filtered = ledger;

    if (filterCurrency !== 'ALL') {
      filtered = filtered.filter(e => e.currency === filterCurrency);
    }
    if (filterType !== 'ALL') {
      filtered = filtered.filter(e => e.transaction_type === filterType);
    }
    if (filterTime !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (filterTime) {
        case '7d': startDate = subDays(now, 7); break;
        case '30d': startDate = subDays(now, 30); break;
        case '90d': startDate = subDays(now, 90); break;
        default: startDate = new Date(0);
      }
      filtered = filtered.filter(e => new Date(e.created_at) >= startDate);
    }

    return filtered;
  }, [ledger, filterCurrency, filterType, filterTime]);

  const stats = useMemo(() => {
    const approved = ledger.filter(e => e.status === 'APPROVED');
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalInterest = 0;

    approved.forEach(e => {
      if (e.transaction_type === 'DEPOSIT' && e.amount > 0) totalDeposits += e.amount;
      if (e.transaction_type === 'WITHDRAWAL' && e.amount < 0) totalWithdrawals += Math.abs(e.amount);
      if (e.transaction_type === 'INTEREST' && e.amount > 0) totalInterest += e.amount;
    });

    return { totalDeposits, totalWithdrawals, totalInterest };
  }, [ledger]);

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'DEPOSIT') return <ArrowDownRight className="h-4 w-4 text-emerald-500" />;
    if (type === 'WITHDRAWAL') return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (type === 'INTEREST') return <TrendingUp className="h-4 w-4 text-blue-500" />;
    if (type === 'FX_CONVERSION') return <Repeat className="h-4 w-4 text-cyan-500" />;
    if (type === 'INVESTMENT_FUNDING') return <Receipt className="h-4 w-4 text-orange-500" />;
    return <Receipt className="h-4 w-4 text-muted-foreground" />;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'INTEREST': 'Interest Payment',
      'FX_CONVERSION': 'Currency Exchange',
      'INVESTMENT_FUNDING': 'Investment',
      'CAPITAL_RETURN': 'Capital Return'
    };
    return labels[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatSortCode = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
    if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return cleaned;
  };

  const getSelectedCurrencyBalance = () => {
    const account = cashAccounts.find(acc => acc.currency === withdrawCurrency);
    return account?.balance || 0;
  };

  const handleWithdraw = async () => {
    if (!clientId || !withdrawAmount || !withdrawCurrency || !selectedBankAccount) return;

    setWithdrawing(true);
    try {
      const bankAccount = savedBankAccounts.find(acc => acc.id === selectedBankAccount);

      const { error: insertError } = await (supabase as any)
        .from('client_requests')
        .insert({
          client_id: clientId,
          request_type: 'WITHDRAWAL_REQUEST',
          status: 'PENDING',
          subject: `Withdrawal Request: ${formatCurrency(parseFloat(withdrawAmount), withdrawCurrency)}`,
          details: `Bank Account: ${bankAccount?.accountName || 'N/A'} - ${bankAccount?.accountNumber || 'N/A'}`,
          amount: parseFloat(withdrawAmount),
          currency: withdrawCurrency,
        });

      if (insertError) throw insertError;

      setWithdrawSuccess(true);
      toast.success('Withdrawal request submitted successfully');
      setWithdrawAmount('');
      setSelectedBankAccount('');

      setTimeout(() => {
        setWithdrawSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting withdrawal:', err);
      toast.error(err.message || 'Failed to submit withdrawal request');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !clientId) {
    return (
      <div className="p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load cash management data'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cash Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your cash balances and transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadClientData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          <Card className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-slate-300" />
                <span className="text-sm text-slate-300">Total Balance</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(totalBalance, 'USD')}</p>
              <p className="text-xs text-slate-400 mt-1">USD equivalent</p>
            </CardContent>
          </Card>

          {cashAccounts.map(account => (
            <Card key={account.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      account.currency === 'GBP' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      account.currency === 'EUR' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <Banknote className={`h-4 w-4 ${
                        account.currency === 'GBP' ? 'text-blue-600' :
                        account.currency === 'EUR' ? 'text-emerald-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{account.currency}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{account.currency}</Badge>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1">Available</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingInvestments.length > 0 && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Payment Required</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {pendingInvestments.length} pending investment{pendingInvestments.length > 1 ? 's' : ''} - {formatCurrency(totalAmountDue, paymentDetails.base_currency)}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setActiveTab('fund')}>
                  Fund Now <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="fund" className="gap-2">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Fund</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Withdraw</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deposited</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.totalDeposits, 'USD')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <ArrowUpCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.totalWithdrawals, 'USD')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Earned</p>
                      <p className="text-xl font-bold">{formatCurrency(stats.totalInterest, 'USD')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getTransactionIcon(tx.transaction_type, tx.amount)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{getTransactionLabel(tx.transaction_type)}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'dd MMM yyyy')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                            </p>
                            <Badge variant="outline" className="text-xs">{tx.currency}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start h-14" onClick={() => setActiveTab('fund')}>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                      <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Fund Account</p>
                      <p className="text-xs text-muted-foreground">Add money via bank transfer</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14" onClick={() => setActiveTab('withdraw')}>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                      <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Withdraw Funds</p>
                      <p className="text-xs text-muted-foreground">Request a withdrawal</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14" onClick={() => setShowConfirmDialog(true)}>
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                      <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Notify Deposit</p>
                      <p className="text-xs text-muted-foreground">Confirm a payment you've made</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-14" onClick={() => setShowCallDialog(true)}>
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg mr-3">
                      <Phone className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Request Call</p>
                      <p className="text-xs text-muted-foreground">Schedule a call with your advisor</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle>Transaction History</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filterTime} onValueChange={setFilterTime}>
                      <SelectTrigger className="w-32">
                        <Clock className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="7d">7 Days</SelectItem>
                        <SelectItem value="30d">30 Days</SelectItem>
                        <SelectItem value="90d">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-36">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="DEPOSIT">Deposits</SelectItem>
                        <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                        <SelectItem value="INTEREST">Interest</SelectItem>
                        <SelectItem value="INVESTMENT_FUNDING">Investments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLedger.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions found</p>
                    <Button variant="link" onClick={() => { setFilterCurrency('ALL'); setFilterType('ALL'); setFilterTime('all'); }}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLedger.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="font-medium">{format(new Date(entry.created_at), 'dd MMM yyyy')}</div>
                              <div className="text-xs text-muted-foreground">{format(new Date(entry.created_at), 'HH:mm')}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(entry.transaction_type, entry.amount)}
                                <div>
                                  <p className="font-medium">{getTransactionLabel(entry.transaction_type)}</p>
                                  {entry.reference && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{entry.reference}</p>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{entry.currency}</Badge></TableCell>
                            <TableCell className="text-right">
                              {entry.amount < 0 ? <span className="text-red-600 font-medium">{formatCurrency(Math.abs(entry.amount), entry.currency)}</span> : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.amount >= 0 ? <span className="text-emerald-600 font-medium">{formatCurrency(entry.amount, entry.currency)}</span> : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {entry.status === 'APPROVED' ? formatCurrency(entry.running_balance, entry.currency) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={entry.status === 'APPROVED' ? 'default' : 'secondary'} className={entry.status === 'APPROVED' ? 'bg-emerald-600' : ''}>
                                {entry.status === 'APPROVED' ? 'Completed' : entry.status}
                              </Badge>
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

          <TabsContent value="fund" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Bank Transfer Details
                    </CardTitle>
                    <CardDescription>Use these details to send money to your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!paymentDetails.payment_account_name ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>Payment details are being configured. Contact your advisor.</AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Your Reference Code</Label>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-2xl font-bold font-mono">{paymentDetails.payment_reference_code}</p>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(paymentDetails.payment_reference_code, 'reference')}>
                              {copiedField === 'reference' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Always include this reference
                          </p>
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Account Name</Label>
                            <div className="flex items-center gap-2">
                              <Input value={paymentDetails.payment_account_name} readOnly className="font-mono bg-muted/50" />
                              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(paymentDetails.payment_account_name, 'name')}>
                                {copiedField === 'name' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          {paymentDetails.payment_sort_code && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Sort Code</Label>
                              <div className="flex items-center gap-2">
                                <Input value={paymentDetails.payment_sort_code} readOnly className="font-mono bg-muted/50" />
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(paymentDetails.payment_sort_code, 'sort')}>
                                  {copiedField === 'sort' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Account Number</Label>
                            <div className="flex items-center gap-2">
                              <Input value={paymentDetails.payment_account_number || '-'} readOnly className="font-mono bg-muted/50" />
                              {paymentDetails.payment_account_number && (
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(paymentDetails.payment_account_number, 'acc')}>
                                  {copiedField === 'acc' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </div>
                          {paymentDetails.payment_iban && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">IBAN</Label>
                              <div className="flex items-center gap-2">
                                <Input value={paymentDetails.payment_iban} readOnly className="font-mono bg-muted/50 text-sm" />
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(paymentDetails.payment_iban, 'iban')}>
                                  {copiedField === 'iban' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                          {paymentDetails.payment_swift_bic && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">SWIFT/BIC</Label>
                              <div className="flex items-center gap-2">
                                <Input value={paymentDetails.payment_swift_bic} readOnly className="font-mono bg-muted/50" />
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(paymentDetails.payment_swift_bic, 'swift')}>
                                  {copiedField === 'swift' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Button variant="outline" className="flex-1" onClick={() => setShowPrintDialog(true)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowConfirmDialog(true)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            I've Made Payment
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-5">
                    <Info className="h-5 w-5 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works</h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <li>1. Copy the bank details above</li>
                      <li>2. Include your reference code</li>
                      <li>3. Make the transfer from your bank</li>
                      <li>4. Click "I've Made Payment"</li>
                      <li>5. Funds arrive in 1-2 business days</li>
                    </ol>
                  </CardContent>
                </Card>

                {pendingInvestments.length > 0 && (
                  <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-5">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mb-3" />
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Amount Due</h4>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {formatCurrency(totalAmountDue, paymentDetails.base_currency)}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        For {pendingInvestments.length} pending investment{pendingInvestments.length > 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5" />
                    Request Withdrawal
                  </CardTitle>
                  <CardDescription>Enter the amount you wish to withdraw</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Select Currency</Label>
                    <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashAccounts.map(acc => (
                          <SelectItem key={acc.currency} value={acc.currency}>
                            {acc.currency} - {formatCurrency(acc.balance, acc.currency)} available
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        {withdrawCurrency || 'USD'}
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="pl-16 h-14 text-xl font-semibold"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map(pct => (
                        <Button key={pct} variant="outline" size="sm" className="flex-1"
                          onClick={() => setWithdrawAmount((getSelectedCurrencyBalance() * (pct / 100)).toFixed(2))}>
                          {pct === 100 ? 'Max' : `${pct}%`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Destination Account</Label>
                    <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedBankAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountName} - {acc.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= getSelectedCurrencyBalance() && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">You will receive</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                        {formatCurrency(parseFloat(withdrawAmount), withdrawCurrency)}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">1-2 business days</p>
                    </div>
                  )}

                  {parseFloat(withdrawAmount) > getSelectedCurrencyBalance() && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Insufficient funds. Max: {formatCurrency(getSelectedCurrencyBalance(), withdrawCurrency)}</AlertDescription>
                    </Alert>
                  )}

                  {withdrawSuccess ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <p className="font-medium text-emerald-700">Withdrawal Request Submitted</p>
                      <p className="text-sm text-emerald-600">We'll process your request within 1-2 business days.</p>
                    </div>
                  ) : (
                    <Button className="w-full h-12"
                      disabled={withdrawing || !withdrawAmount || !selectedBankAccount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > getSelectedCurrencyBalance()}
                      onClick={handleWithdraw}>
                      {withdrawing ? 'Submitting...' : 'Request Withdrawal'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Bank Accounts
                      </CardTitle>
                      <CardDescription>Your verified withdrawal destinations</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowAddBankAccount(!showAddBankAccount)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedBankAccounts.map(acc => (
                    <div key={acc.id} className="p-4 bg-muted/30 rounded-lg border hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{acc.accountName}</p>
                            {acc.verified && (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {acc.sortCode && `${acc.sortCode} `}{acc.accountNumber}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {showAddBankAccount && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4 space-y-4">
                        <p className="font-semibold">Add Bank Account</p>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Select value={newBankAccount.country} onValueChange={v => setNewBankAccount({...newBankAccount, country: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="EU">European Union</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Account Holder Name</Label>
                          <Input value={newBankAccount.accountName} onChange={e => setNewBankAccount({...newBankAccount, accountName: e.target.value})} placeholder="Name" />
                        </div>
                        {newBankAccount.country === 'UK' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Sort Code</Label>
                              <Input value={newBankAccount.sortCode} onChange={e => setNewBankAccount({...newBankAccount, sortCode: formatSortCode(e.target.value)})} placeholder="XX-XX-XX" />
                            </div>
                            <div className="space-y-2">
                              <Label>Account Number</Label>
                              <Input value={newBankAccount.accountNumber} onChange={e => setNewBankAccount({...newBankAccount, accountNumber: e.target.value.replace(/[^0-9]/g, '')})} placeholder="8 digits" />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button className="flex-1" disabled={!newBankAccount.accountName}>Add</Button>
                          <Button variant="outline" onClick={() => setShowAddBankAccount(false)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmPaymentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        amountDue={totalAmountDue}
        currency={paymentDetails.base_currency}
        onSuccess={() => { loadClientData(); setShowConfirmDialog(false); }}
      />

      <PrintPaymentInstructions
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        paymentDetails={paymentDetails}
        clientName={profile?.name}
        amountDue={totalAmountDue > 0 ? totalAmountDue : undefined}
      />

      <RequestCallDialog
        open={showCallDialog}
        onOpenChange={setShowCallDialog}
        onSuccess={() => {
          toast.success('Call request submitted. Your advisor will contact you soon.');
        }}
      />
    </div>
  );
}
