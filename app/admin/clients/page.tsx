'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format';
import { CreateClientForm } from '@/components/admin/create-client-form';
import { ClientAccountActions } from '@/components/admin/client-account-actions';

interface Client {
  id: string;
  user_id: string;
  account_type: string;
  base_currency: string;
  kyc_status: string;
  account_status: string;
  created_at: string;
  profile: { name: string };
  email: string;
  totalHoldings?: number;
  cashBalance?: number;
}

export default function ClientsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKYCStatus, setFilterKYCStatus] = useState('ALL');
  const [filterAccountStatus, setFilterAccountStatus] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data: clientsData, error } = await supabase
        .from('clients_with_email')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        throw error;
      }

      const clientsWithDetails = await Promise.all(
        (clientsData || []).map(async (client: any) => {
          const [holdingsData, cashData] = await Promise.all([
            supabase.from('holdings').select('current_value').eq('client_id', client.id).eq('status', 'ACTIVE'),
            supabase.from('cash_balances').select('balance').eq('client_id', client.id).eq('currency', client.base_currency).maybeSingle(),
          ]);

          const totalHoldings = (holdingsData.data || []).reduce((sum: number, h: any) => sum + Number(h.current_value), 0);

          return {
            ...client,
            profile: { name: client.profile_name },
            totalHoldings,
            cashBalance: Number((cashData.data as any)?.balance || 0)
          };
        })
      );

      setClients(clientsWithDetails);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };


  const filteredClients = clients.filter(client => {
    const matchesSearch = client.profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKYCFilter = filterKYCStatus === 'ALL' || client.kyc_status === filterKYCStatus;
    const matchesAccountFilter = filterAccountStatus === 'ALL' || client.account_status === filterAccountStatus;
    return matchesSearch && matchesKYCFilter && matchesAccountFilter;
  });

  const getKYCBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Suspended</Badge>;
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status || 'ACTIVE'}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all client accounts</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg">
          <UserPlus className="h-4 w-4 mr-2" />
          Create New Client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {clients.filter(c => c.account_status === 'ACTIVE' || !c.account_status).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {clients.filter(c => c.account_status === 'SUSPENDED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KYC Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clients.filter(c => c.kyc_status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(clients.reduce((sum, c) => sum + (c.totalHoldings || 0), 0), 'GBP')}
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAccountStatus} onValueChange={setFilterAccountStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterKYCStatus} onValueChange={setFilterKYCStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All KYC Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Holdings Value</TableHead>
                  <TableHead>Cash Balance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{client.profile.name}</TableCell>
                    <TableCell className="text-sm">{client.email}</TableCell>
                    <TableCell><Badge variant="outline">{client.account_type}</Badge></TableCell>
                    <TableCell>{getAccountStatusBadge(client.account_status)}</TableCell>
                    <TableCell>{getKYCBadge(client.kyc_status)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(client.totalHoldings || 0, client.base_currency)}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {formatCurrency(client.cashBalance || 0, client.base_currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(client.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <ClientAccountActions
                          clientId={client.id}
                          clientName={client.profile.name}
                          currentStatus={client.account_status || 'ACTIVE'}
                          onSuccess={loadClients}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateClientForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadClients}
      />
    </div>
  );
}
