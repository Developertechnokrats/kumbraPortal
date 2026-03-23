'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, FileText, TrendingUp, Calendar, Plus, Wallet, Upload, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddInvestmentDialog } from '@/components/admin/add-investment-dialog';
import { AddFundsDialog } from '@/components/admin/add-funds-dialog';
import { FundPendingInvestmentDialog } from '@/components/admin/fund-pending-investment-dialog';
import { UploadDocumentDialog } from '@/components/admin/upload-document-dialog';
import { EditClientDialog } from '@/components/admin/edit-client-dialog';
import { AddIPOHoldingDialog } from '@/components/admin/add-ipo-holding-dialog';
import { CompanyLogo } from '@/components/ui/company-logo';
import { AdminHoldingDetailModal } from '@/components/admin/admin-holding-detail-modal';

interface ClientDetail {
  id: string;
  user_id: string;
  account_type: string;
  base_currency: string;
  kyc_status: string;
  kyc_rejection_reason: string | null;
  kyc_documents_approved: boolean | null;
  bank_verified: boolean;
  risk_score: number;
  country_of_residence: string | null;
  tax_residency: string | null;
  risk_profile: string | null;
  payment_reference_code: string | null;
  member_since: string | null;
  assigned_advisor_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  date_of_birth: string | null;
  date_of_birth_holder2: string | null;
  company_incorporation_date: string | null;
  payment_account_name: string | null;
  payment_bsb: string | null;
  payment_account_number: string | null;
  created_at: string;
  profile: {
    name: string;
    email: string;
    phone: string | null;
  };
  cash_balances: Array<{
    currency: string;
    balance: number;
  }>;
  holdings: Array<any>;
  documents: Array<any>;
  transactions: Array<any>;
  audit_logs: Array<any>;
  notifications: Array<any>;
  bank_accounts: Array<any>;
  inbound_emails: Array<any>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isFundPendingOpen, setIsFundPendingOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isAddIPOOpen, setIsAddIPOOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<any>(null);
  const [isHoldingDetailOpen, setIsHoldingDetailOpen] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [params.id]);

  const loadClientData = async () => {
    try {
      setLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          profile:profiles!clients_user_id_fkey(name, phone)
        `)
        .eq('id', params.id)
        .single();

      if (clientError) throw clientError;

      const { data: userData } = await supabase.auth.admin.getUserById((clientData as any).user_id);

      const [cashData, holdingsData, documentsData, transactionsData, auditLogsData, notificationsData, bankAccountsData, emailsData] = await Promise.all([
        supabase.from('cash_balances').select('*').eq('client_id', params.id),
        supabase
          .from('holdings')
          .select(`
            *,
            instrument:instruments(*)
          `)
          .eq('client_id', params.id)
          .order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').eq('entity_id', params.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
        supabase.from('client_bank_accounts').select('*').eq('client_id', params.id),
        supabase.from('inbound_emails').select('*').eq('client_id', params.id).order('created_at', { ascending: false }).limit(20),
      ]);

      setClient({
        ...(clientData as any),
        profile: {
          ...(clientData as any).profile,
          email: userData?.user?.email || 'N/A',
        },
        cash_balances: cashData.data || [],
        holdings: holdingsData.data || [],
        documents: documentsData.data || [],
        transactions: transactionsData.data || [],
        audit_logs: auditLogsData.data || [],
        notifications: notificationsData.data || [],
        bank_accounts: bankAccountsData.data || [],
        inbound_emails: emailsData.data || [],
      } as any);
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApproval = async (approved: boolean) => {
    try {
      const result: any = await (supabase as any)
        .from('clients')
        .update({
          kyc_status: approved ? 'APPROVED' : 'REJECTED',
          kyc_rejection_reason: approved ? null : 'Pending review notes',
        })
        .eq('id', params.id);

      if (result.error) throw result.error;

      alert(approved ? 'KYC approved successfully!' : 'KYC rejected');
      loadClientData();
    } catch (error: any) {
      console.error('Error updating KYC:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(doc.file_url, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing document:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!client) {
    return <div className="p-8">Client not found</div>;
  }

  const totalCashValue = client.cash_balances.reduce((sum, bal) => sum + Number(bal.balance), 0);
  const totalHoldingsValue = client.holdings.reduce((sum, holding) => sum + Number(holding.current_value), 0);
  const totalValue = totalCashValue + totalHoldingsValue;
  const pendingHoldings = client.holdings.filter((h: any) => h.status === 'PENDING');

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.profile.name}</h1>
            <p className="text-muted-foreground">{client.profile.email}</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={() => setIsEditClientOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
            <Badge
              variant="outline"
              className={
                client.kyc_status === 'APPROVED'
                  ? 'bg-green-500/10 text-green-500'
                  : client.kyc_status === 'PENDING'
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : 'bg-red-500/10 text-red-500'
              }
            >
              KYC: {client.kyc_status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.base_currency} {totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.base_currency} {totalCashValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.holdings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.risk_score}/10</div>
          </CardContent>
        </Card>
      </div>

      {client.kyc_status === 'PENDING' && (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>This client's KYC is pending approval</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleKYCApproval(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleKYCApproval(false)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex gap-3">
        <Button onClick={() => setIsAddFundsOpen(true)}>
          <Wallet className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
        {pendingHoldings.length > 0 && (
          <Button onClick={() => setIsFundPendingOpen(true)} variant="secondary">
            <DollarSign className="mr-2 h-4 w-4" />
            Fund Pending Investment ({pendingHoldings.length})
          </Button>
        )}
        <Button onClick={() => setIsUploadDocOpen(true)} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity ({client.transactions.length})</TabsTrigger>
          <TabsTrigger value="cash">Cash Balances</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notifications">Notifications ({client.notifications.length})</TabsTrigger>
          <TabsTrigger value="communications">Communications ({client.inbound_emails.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Type:</span>
                  <span className="font-medium">{client.account_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Currency:</span>
                  <span className="font-medium">{client.base_currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">{client.member_since ? new Date(client.member_since).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Reference:</span>
                  <span className="font-medium">{client.payment_reference_code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Verified:</span>
                  <span className="font-medium">{client.bank_verified ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{client.profile.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-medium">{client.country_of_residence || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Residency:</span>
                  <span className="font-medium">{client.tax_residency || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Profile:</span>
                  <span className="font-medium">{client.risk_profile || 'Not assessed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advisor:</span>
                  <span className="font-medium">{client.assigned_advisor_name || 'Not assigned'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.address_line1 || client.city || client.state || client.postcode ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address Line 1:</span>
                      <span className="font-medium">{client.address_line1 || 'N/A'}</span>
                    </div>
                    {client.address_line2 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address Line 2:</span>
                        <span className="font-medium">{client.address_line2}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City / Suburb:</span>
                      <span className="font-medium">{client.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">State / Province:</span>
                      <span className="font-medium">{client.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Postcode:</span>
                      <span className="font-medium">{client.postcode || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No address on file</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date of Birth Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.account_type === 'INDIVIDUAL' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium">
                      {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
                {client.account_type === 'JOINT' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DOB - Holder 1:</span>
                      <span className="font-medium">
                        {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DOB - Holder 2:</span>
                      <span className="font-medium">
                        {client.date_of_birth_holder2 ? new Date(client.date_of_birth_holder2).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {client.account_type === 'CORPORATE' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incorporation Date:</span>
                    <span className="font-medium">
                      {client.company_incorporation_date ? new Date(client.company_incorporation_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Instructions</CardTitle>
                    <CardDescription>Bank details for client deposits</CardDescription>
                  </div>
                  <Button onClick={() => setIsEditClientOpen(true)} variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.payment_account_name || client.payment_bsb || client.payment_account_number ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium">{client.payment_account_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BSB:</span>
                      <span className="font-medium">{client.payment_bsb || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium">{client.payment_account_number || 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">No payment instructions configured</p>
                    <Button onClick={() => setIsEditClientOpen(true)} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>{client.bank_accounts.length} account(s) on file</CardDescription>
              </CardHeader>
              <CardContent>
                {client.bank_accounts.length > 0 ? (
                  <div className="space-y-3">
                    {client.bank_accounts.map((account: any) => (
                      <div key={account.id} className="border-l-2 border-primary pl-3">
                        <div className="font-medium">{account.bank_name}</div>
                        <div className="text-sm text-muted-foreground">{account.name_on_account}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.account_number ? `****${account.account_number.slice(-4)}` : account.iban}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={account.verified ? 'default' : 'secondary'}>
                            {account.verified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge variant="outline">{account.currency}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bank accounts on file</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest 5 transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {client.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {client.transactions
                      .slice(0, 5)
                      .map((tx: any) => (
                        <div key={tx.id} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="font-medium">{tx.type}</div>
                            <div className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className={`font-medium ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.currency} {Number(tx.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All transactions and account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.metadata_json?.notes || tx.metadata_json?.description || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.currency} {Number(tx.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {client.transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>Cash Balances by Currency</CardTitle>
              <CardDescription>Available cash in different currencies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.cash_balances.map((balance) => (
                    <TableRow key={balance.currency}>
                      <TableCell className="font-medium">{balance.currency}</TableCell>
                      <TableCell className="text-right">
                        {Number(balance.balance).toLocaleString('en-GB', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holdings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Investment Holdings</CardTitle>
                  <CardDescription>Current positions and valuations</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddIPOOpen(true)} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Pre-IPO
                  </Button>
                  <Button onClick={() => setIsAddInvestmentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Asset Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.holdings.map((holding: any) => (
                    <TableRow
                      key={holding.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedHolding(holding);
                        setIsHoldingDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            issuerName={holding.instrument?.issuer_name || 'Unknown'}
                            issuerDomain={holding.instrument?.issuer_domain}
                            customLogoUrl={holding.instrument?.metadata_json?.company_logo}
                            size="sm"
                          />
                          <span>{holding.instrument?.issuer_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{holding.instrument?.asset_class || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={holding.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {holding.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{Number(holding.face_or_units)}</TableCell>
                      <TableCell className="text-right">
                        {holding.currency} {Number(holding.cost_basis).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.currency} {Number(holding.current_value).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right ${Number(holding.unrealised_pl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(holding.unrealised_pl) >= 0 ? '+' : ''}
                        {Number(holding.unrealised_pl).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Client documents and KYC materials</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {client.documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No documents found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Notifications sent to this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {client.notifications.length > 0 ? (
                  client.notifications.map((notif: any) => (
                    <div key={notif.id} className="border-l-2 border-primary pl-3 py-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{notif.type}</div>
                        <Badge variant={notif.read ? 'outline' : 'default'}>
                          {notif.read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                      {notif.data_json && Object.keys(notif.data_json).length > 0 && (
                        <div className="text-sm mt-2 bg-muted p-2 rounded">
                          <pre className="text-xs overflow-auto">{JSON.stringify(notif.data_json, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No notifications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Email Communications</CardTitle>
              <CardDescription>Inbound emails from this client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {client.inbound_emails.length > 0 ? (
                  client.inbound_emails.map((email: any) => (
                    <div key={email.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{email.subject || '(No Subject)'}</div>
                          <div className="text-sm text-muted-foreground">
                            From: {email.from_name || email.from_address}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            To: {email.to_address}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={email.is_read ? 'outline' : 'default'}>
                            {email.is_read ? 'Read' : 'Unread'}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(email.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm mt-3 p-3 bg-muted rounded whitespace-pre-wrap">
                        {email.text_body || '(No content)'}
                      </div>
                      {email.attachments_json && email.attachments_json.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Attachments:</span> {email.attachments_json.length} file(s)
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No email communications found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>System activity and changes for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.audit_logs.length > 0 ? (
                    client.audit_logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entity}</TableCell>
                        <TableCell className="text-xs">
                          {log.before_json || log.after_json ? (
                            <details className="cursor-pointer">
                              <summary className="text-primary">View changes</summary>
                              <div className="mt-2 space-y-2">
                                {log.before_json && (
                                  <div>
                                    <div className="font-medium">Before:</div>
                                    <pre className="bg-muted p-2 rounded overflow-auto text-xs">
                                      {JSON.stringify(log.before_json, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.after_json && (
                                  <div>
                                    <div className="font-medium">After:</div>
                                    <pre className="bg-muted p-2 rounded overflow-auto text-xs">
                                      {JSON.stringify(log.after_json, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddInvestmentDialog
        open={isAddInvestmentOpen}
        onOpenChange={setIsAddInvestmentOpen}
        clientId={params.id as string}
        onSuccess={loadClientData}
      />

      <AddFundsDialog
        open={isAddFundsOpen}
        onOpenChange={setIsAddFundsOpen}
        clientId={params.id as string}
        baseCurrency={client.base_currency}
        onSuccess={loadClientData}
      />

      <FundPendingInvestmentDialog
        open={isFundPendingOpen}
        onOpenChange={setIsFundPendingOpen}
        clientId={params.id as string}
        pendingHoldings={pendingHoldings}
        cashBalance={totalCashValue}
        baseCurrency={client.base_currency}
        onSuccess={loadClientData}
      />

      <UploadDocumentDialog
        open={isUploadDocOpen}
        onOpenChange={setIsUploadDocOpen}
        clientId={params.id as string}
        onSuccess={loadClientData}
      />

      <EditClientDialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        clientData={client}
        onSuccess={loadClientData}
      />

      <AddIPOHoldingDialog
        open={isAddIPOOpen}
        onOpenChange={setIsAddIPOOpen}
        clientId={params.id as string}
        onSuccess={loadClientData}
      />

      {selectedHolding && (
        <AdminHoldingDetailModal
          open={isHoldingDetailOpen}
          onOpenChange={setIsHoldingDetailOpen}
          holding={selectedHolding}
          onSuccess={loadClientData}
        />
      )}
    </div>
  );
}
