'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Download, RefreshCw, ArrowDownCircle, ArrowUpCircle, Repeat, TrendingUp, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCurrency, setFilterCurrency] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
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

      const { data, error } = await (supabase as any)
        .from('cash_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const ledgerEntries: LedgerEntry[] = (data || []).map((l: any) => ({
        ...l,
        client_name: clientIdToName.get(l.client_id) || 'Unknown'
      }));

      setTransactions(ledgerEntries);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
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
      case 'CAPITAL_RETURN':
        return <ArrowDownCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'DEPOSIT': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'WITHDRAWAL': 'bg-red-100 text-red-700 border-red-200',
      'INVESTMENT_FUNDING': 'bg-purple-100 text-purple-700 border-purple-200',
      'INTEREST': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'CAPITAL_RETURN': 'bg-orange-100 text-orange-700 border-orange-200',
      'FX_CONVERSION': 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return <Badge variant="outline" className={colors[type] || ''}>{type.replace('_', ' ')}</Badge>;
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (txn.reference && txn.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (txn.notes && txn.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || txn.transaction_type === filterType;
    const matchesCurrency = filterCurrency === 'ALL' || txn.currency === filterCurrency;
    const matchesStatus = filterStatus === 'ALL' || txn.status === filterStatus;
    return matchesSearch && matchesType && matchesCurrency && matchesStatus;
  });

  const totalCredits = filteredTransactions.filter(t => t.amount > 0 && t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = filteredTransactions.filter(t => t.amount < 0 && t.status === 'APPROVED').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingCount = filteredTransactions.filter(t => t.status === 'PENDING').length;

  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Type', 'Currency', 'Debit', 'Credit', 'Balance', 'Status', 'Reference'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
      t.client_name,
      t.transaction_type,
      t.currency,
      t.amount < 0 ? Math.abs(t.amount).toFixed(2) : '',
      t.amount >= 0 ? t.amount.toFixed(2) : '',
      t.status === 'APPROVED' ? t.running_balance.toFixed(2) : '',
      t.status,
      t.reference || t.notes || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Account</h1>
          <p className="text-muted-foreground mt-1">Complete audit trail of all client cash movements</p>
        </div>
        <Button variant="outline" onClick={loadTransactions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Matching filters</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCredits, 'USD')}</div>
            <p className="text-xs text-muted-foreground mt-1">Money in (approved)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDebits, 'USD')}</div>
            <p className="text-xs text-muted-foreground mt-1">Money out (approved)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, reference or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="INVESTMENT_FUNDING">Investment</SelectItem>
                <SelectItem value="INTEREST">Interest</SelectItem>
                <SelectItem value="CAPITAL_RETURN">Capital Return</SelectItem>
                <SelectItem value="FX_CONVERSION">FX Conversion</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                    <TableHead>Reference / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(txn.created_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">{txn.client_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(txn.transaction_type)}
                          {getTypeBadge(txn.transaction_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {txn.amount < 0 ? formatCurrency(Math.abs(txn.amount), txn.currency) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {txn.amount >= 0 ? formatCurrency(txn.amount, txn.currency) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {txn.status === 'APPROVED' ? formatCurrency(txn.running_balance, txn.currency) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.status === 'APPROVED' ? 'default' : txn.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {txn.transaction_type === 'FX_CONVERSION' && txn.fx_rate ? (
                            <span className="font-mono">{txn.fx_currency_from} → {txn.fx_currency_to} @ {txn.fx_rate.toFixed(4)}</span>
                          ) : (
                            txn.reference || txn.notes || '-'
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
