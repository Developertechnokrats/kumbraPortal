'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  FileText,
  BarChart3,
  ArrowUpRight,
  Loader2,
  Upload,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalAUM: number;
  pendingDeposits: number;
  pendingDepositValue: number;
  pendingKYC: number;
  unreadMessages: number;
  pendingDocuments: number;
}

interface PendingDeposit {
  id: string;
  client_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

interface RecentDocument {
  id: string;
  client_name: string;
  title: string;
  type: string;
  created_at: string;
}

interface RecentTransaction {
  id: string;
  client_name: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  reference: string | null;
}

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalAUM: 0,
    pendingDeposits: 0,
    pendingDepositValue: 0,
    pendingKYC: 0,
    unreadMessages: 0,
    pendingDocuments: 0
  });
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const { data: clientsData } = await (supabase as any)
        .from('clients')
        .select('id, user_id, kyc_status')
        .eq('archived', false);

      const clientIds = (clientsData || []).map((c: any) => c.user_id);

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.name]));
      const clientIdToName = new Map((clientsData || []).map((c: any) => [c.id, profileMap.get(c.user_id) || 'Unknown']));

      const [
        holdingsRes,
        depositsRes,
        documentsRes,
        messagesRes,
        ledgerRes
      ] = await Promise.all([
        (supabase as any).from('holdings').select('current_value, currency, status').eq('status', 'ACTIVE'),
        (supabase as any).from('deposit_notifications').select('*').eq('status', 'PENDING'),
        (supabase as any).from('documents').select('*').order('created_at', { ascending: false }).limit(10),
        (supabase as any).from('messages').select('id, read_by'),
        (supabase as any).from('cash_ledger').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      const holdings = holdingsRes.data || [];
      const deposits = depositsRes.data || [];
      const documents = documentsRes.data || [];
      const messages = messagesRes.data || [];
      const ledger = ledgerRes.data || [];

      const pendingDepositTotal = deposits.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

      const totalAUM = holdings.reduce((sum: number, h: any) => sum + Number(h.current_value), 0);

      const recentDocs = documents.filter((d: any) => {
        const uploadedRecently = new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return uploadedRecently;
      });

      setStats({
        totalClients: clientsData?.length || 0,
        activeClients: (clientsData || []).filter((c: any) => c.kyc_status === 'APPROVED').length,
        totalAUM,
        pendingDeposits: deposits.length,
        pendingDepositValue: pendingDepositTotal,
        pendingKYC: (clientsData || []).filter((c: any) => c.kyc_status === 'PENDING').length,
        unreadMessages: messages.length,
        pendingDocuments: recentDocs.length
      });

      const depositsWithNames: PendingDeposit[] = deposits.map((d: any) => ({
        id: d.id,
        client_name: clientIdToName.get(d.client_id) || 'Unknown',
        amount: d.amount,
        currency: d.currency,
        payment_method: d.payment_method,
        created_at: d.created_at
      }));
      setPendingDeposits(depositsWithNames.slice(0, 5));

      const docsWithNames: RecentDocument[] = recentDocs.map((d: any) => ({
        id: d.id,
        client_name: clientIdToName.get(d.client_id) || 'Unknown',
        title: d.title,
        type: d.type,
        created_at: d.created_at
      }));
      setRecentDocuments(docsWithNames.slice(0, 5));

      const txnsWithNames: RecentTransaction[] = ledger.map((t: any) => ({
        id: t.id,
        client_name: clientIdToName.get(t.client_id) || 'Unknown',
        transaction_type: t.transaction_type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        created_at: t.created_at,
        reference: t.reference || t.notes
      }));
      setRecentTransactions(txnsWithNames);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {profile?.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeClients} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets Under Management</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalAUM, 'USD')}</div>
            <p className="text-xs text-emerald-600 mt-1">Active holdings value</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingDeposits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(stats.pendingDepositValue, 'USD')} value
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingKYC + stats.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingKYC} KYC | {stats.pendingDocuments} Docs
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Deposits</CardTitle>
              <CardDescription>Awaiting approval</CardDescription>
            </div>
            <Link href="/admin/deposits">
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingDeposits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending deposits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{deposit.client_name}</p>
                        <p className="text-sm text-muted-foreground">{deposit.payment_method.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{formatCurrency(deposit.amount, deposit.currency)}</p>
                      <Badge variant="outline" className="mt-1">
                        {format(new Date(deposit.created_at), 'dd MMM')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>New uploads (last 7 days)</CardDescription>
            </div>
            <Link href="/admin/documents">
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{doc.client_name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-40">{doc.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{doc.type}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.created_at), 'dd MMM HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/admin/deposits">
              <Button className="w-full justify-start h-auto py-4" variant="outline">
                <Clock className="h-5 w-5 mr-3 text-amber-500" />
                <div className="flex-1 text-left">
                  <p className="font-semibold">Approve Deposits</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingDeposits} pending</p>
                </div>
                {stats.pendingDeposits > 0 && <Badge variant="destructive">{stats.pendingDeposits}</Badge>}
              </Button>
            </Link>

            <Link href="/admin/documents">
              <Button className="w-full justify-start h-auto py-4" variant="outline">
                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                <div className="flex-1 text-left">
                  <p className="font-semibold">Review Documents</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingDocuments} new</p>
                </div>
                {stats.pendingDocuments > 0 && <Badge variant="destructive">{stats.pendingDocuments}</Badge>}
              </Button>
            </Link>

            <Link href="/admin/cash">
              <Button className="w-full justify-start h-auto py-4" variant="outline">
                <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                <div className="flex-1 text-left">
                  <p className="font-semibold">Cash Management</p>
                  <p className="text-xs text-muted-foreground">View all accounts</p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/transactions">
              <Button className="w-full justify-start h-auto py-4" variant="outline">
                <BarChart3 className="h-5 w-5 mr-3 text-purple-500" />
                <div className="flex-1 text-left">
                  <p className="font-semibold">Transactions</p>
                  <p className="text-xs text-muted-foreground">Full audit trail</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest cash movements across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent transactions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(txn.created_at), 'dd MMM HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{txn.client_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(txn.transaction_type)}
                        <span className="text-sm">{txn.transaction_type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {txn.amount < 0 ? formatCurrency(Math.abs(txn.amount), txn.currency) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {txn.amount >= 0 ? formatCurrency(txn.amount, txn.currency) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={txn.status === 'APPROVED' ? 'default' : 'secondary'}
                        className={txn.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {txn.reference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
