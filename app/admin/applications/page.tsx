'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Users,
  FileSignature,
  Globe,
  Calendar,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

type ApplicationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'PORTAL_CREATED'
  | 'APPROVED'
  | 'REJECTED';

interface ApplicationRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  account_type: string | null;
  preferred_language: string | null;
  english_fluency: string | null;
  contact_preference: string[] | null;
  risk_tolerance: string | null;
  employment_status: string | null;
  source_of_funds: string | null;
  preferred_asset_class: string[] | null;
  investment_range: string | null;
  preferred_currency: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  kyc_upload_preference: string | null;
  terms_accepted: boolean | null;
  terms_accepted_at: string | null;
  digital_signature_acknowledged: boolean | null;
  joint_investment_decision_rights: string | null;
  joint_dispersement_rights: string | null;
  corporate_company_name: string | null;
  corporate_domicile: string | null;
  corporate_nature_of_business: string | null;
  corporate_registration_number: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

interface AccountHolder {
  id: string;
  application_id: string;
  holder_type: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  director_title: string | null;
  is_beneficial_owner: boolean | null;
  shareholding_percentage: number | null;
}

interface ApplicationSignature {
  id: string;
  application_id: string;
  signature_type: string;
  signature_data: string;
  legal_acknowledgments: string[] | null;
  created_at: string;
}

interface PortalAccountLookup {
  email: string;
  exists: boolean;
}

export default function ApplicationsPage() {
  const { profile, isAdmin, isAdvisor } = useAuth();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedApplication, setSelectedApplication] = useState<ApplicationRow | null>(null);
  const [holders, setHolders] = useState<AccountHolder[]>([]);
  const [signature, setSignature] = useState<ApplicationSignature | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetApplication, setTargetApplication] = useState<ApplicationRow | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const [portalAccounts, setPortalAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAdmin || isAdvisor) {
      loadApplications();
    } else {
      setLoading(false);
    }
  }, [isAdmin, isAdvisor]);

  const normalizeEmail = (email: string | null | undefined) => (email || '').trim().toLowerCase();

  const loadPortalAccountMap = async (apps: ApplicationRow[]) => {
    try {
      const emails = apps
        .map((a) => normalizeEmail(a.email))
        .filter(Boolean);

      if (emails.length === 0) {
        setPortalAccounts({});
        return;
      }

      // Try clients_with_email first because your admin pages already use it
      const { data, error } = await (supabase as any)
        .from('clients_with_email')
        .select('email')
        .in('email', emails);

      if (error) {
        console.error('Error loading portal account map:', error);
        setPortalAccounts({});
        return;
      }

      const map: Record<string, boolean> = {};
      (data || []).forEach((row: PortalAccountLookup) => {
        map[normalizeEmail(row.email)] = true;
      });

      setPortalAccounts(map);
    } catch (error) {
      console.error('Error loading portal account map:', error);
      setPortalAccounts({});
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('account_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as ApplicationRow[];
      setApplications(rows);
      await loadPortalAccountMap(rows);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetails = async (application: ApplicationRow) => {
    try {
      setSelectedApplication(application);
      setDetailsLoading(true);
      setHolders([]);
      setSignature(null);

      const [{ data: holdersData, error: holdersError }, { data: signatureData, error: signatureError }] =
        await Promise.all([
          supabase
            .from('account_holders')
            .select('*')
            .eq('application_id', application.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('application_signatures')
            .select('*')
            .eq('application_id', application.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (holdersError) throw holdersError;
      if (signatureError) throw signatureError;

      setHolders((holdersData || []) as AccountHolder[]);
      setSignature((signatureData as ApplicationSignature | null) || null);
    } catch (error) {
      console.error('Error loading application details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const fullName = `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase();
      const email = normalizeEmail(app.email);
      const company = (app.corporate_company_name || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        email.includes(term) ||
        company.includes(term) ||
        (app.account_type || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'ALL' || (app.status || 'PENDING') === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => (a.status || 'PENDING') === 'PENDING').length,
      underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
      portalCreated: applications.filter((a) => a.status === 'PORTAL_CREATED').length,
      approved: applications.filter((a) => a.status === 'APPROVED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };
  }, [applications]);

  const getStatusBadge = (status: string | null) => {
    switch (status || 'PENDING') {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Under Review
          </Badge>
        );
      case 'PORTAL_CREATED':
        return (
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
            Portal Created
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDisplayName = (app: ApplicationRow) => {
    if ((app.account_type || '').toLowerCase() === 'corporate') {
      return app.corporate_company_name || 'Corporate Application';
    }
    return `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unnamed Applicant';
  };

  const hasPortalAccount = (email: string | null) => {
    return portalAccounts[normalizeEmail(email)] === true;
  };

  const openStatusDialog = (application: ApplicationRow) => {
    setTargetApplication(application);
    setNewStatus(((application.status as ApplicationStatus) || 'UNDER_REVIEW') as ApplicationStatus);
    setAdminNotes('');
    setStatusDialogOpen(true);
  };

  const updateStatus = async () => {
    if (!targetApplication) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from('account_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetApplication.id);

      if (error) throw error;

      try {
        await (supabase as any).from('audit_logs').insert({
          actor_id: profile?.id || null,
          action: `APPLICATION_${newStatus}`,
          entity: 'ACCOUNT_APPLICATION',
          entity_id: targetApplication.id,
          before_json: { status: targetApplication.status || 'PENDING' },
          after_json: { status: newStatus, notes: adminNotes || null },
        });
      } catch (auditError) {
        console.error('Audit log insert failed:', auditError);
      }

      setStatusDialogOpen(false);
      setTargetApplication(null);
      setAdminNotes('');
      await loadApplications();

      if (selectedApplication?.id === targetApplication.id) {
        setSelectedApplication({
          ...selectedApplication,
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    } finally {
      setProcessing(false);
    }
  };

  const approveApplication = async (application: ApplicationRow) => {
    try {
      setProcessing(true);

      const email = normalizeEmail(application.email);
      const portalExists = hasPortalAccount(email);

      const nextStatus: ApplicationStatus = portalExists ? 'PORTAL_CREATED' : 'APPROVED';

      const { error: applicationError } = await supabase
        .from('account_applications')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (applicationError) throw applicationError;

      try {
        await (supabase as any).from('audit_logs').insert({
          actor_id: profile?.id || null,
          action: 'APPLICATION_APPROVED',
          entity: 'ACCOUNT_APPLICATION',
          entity_id: application.id,
          before_json: { status: application.status || 'PENDING' },
          after_json: {
            status: nextStatus,
            portal_account_exists: portalExists,
          },
        });
      } catch (auditError) {
        console.error('Audit log failed:', auditError);
      }

      await loadApplications();

      if (selectedApplication?.id === application.id) {
        setSelectedApplication({
          ...selectedApplication,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        });
      }

      if (portalExists) {
        alert('Application approved. A portal account already exists for this email, so the status was set to PORTAL_CREATED.');
      } else {
        alert('Application approved. The client can now sign up in the Client Portal using the same email.');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin && !isAdvisor) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Review submitted account applications and move them through the onboarding process
          </p>
        </div>
        <Button variant="outline" onClick={loadApplications}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portal Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats.portalCreated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Search and review submitted applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by applicant, company, email, or account type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="PORTAL_CREATED">Portal Created</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-sm">
                      {new Date(app.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="font-medium">{getDisplayName(app)}</TableCell>
                    <TableCell className="text-sm">{app.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{(app.account_type || 'individual').toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{app.country || app.corporate_domicile || '-'}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      {hasPortalAccount(app.email) ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{app.preferred_currency || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={() => loadApplicationDetails(app)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => approveApplication(app)}
                          disabled={processing || app.status === 'APPROVED' || app.status === 'PORTAL_CREATED'}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStatusDialog(app)}
                        >
                          Update
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

      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the submitted application, related holders, and signature details
            </DialogDescription>
          </DialogHeader>

          {!selectedApplication || detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold">{getDisplayName(selectedApplication)}</h2>
                  <p className="text-sm text-muted-foreground">{selectedApplication.email || 'No email'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(selectedApplication.status)}
                  {hasPortalAccount(selectedApplication.email) && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Portal Account Exists
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal / Primary Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {getDisplayName(selectedApplication)}</p>
                    <p><strong>Email:</strong> {selectedApplication.email || '-'}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phone || '-'}</p>
                    <p><strong>Country:</strong> {selectedApplication.country || '-'}</p>
                    <p><strong>Nationality:</strong> {selectedApplication.nationality || '-'}</p>
                    <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth || '-'}</p>
                    <p><strong>Account Type:</strong> {(selectedApplication.account_type || '-').toUpperCase()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Preferences & Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Preferred Language:</strong> {selectedApplication.preferred_language || '-'}</p>
                    <p><strong>English Fluency:</strong> {selectedApplication.english_fluency || '-'}</p>
                    <p><strong>Risk Tolerance:</strong> {selectedApplication.risk_tolerance || '-'}</p>
                    <p><strong>Employment Status:</strong> {selectedApplication.employment_status || '-'}</p>
                    <p><strong>Source of Funds:</strong> {selectedApplication.source_of_funds || '-'}</p>
                    <p>
                      <strong>Contact Preferences:</strong>{' '}
                      {selectedApplication.contact_preference?.length
                        ? selectedApplication.contact_preference.join(', ')
                        : '-'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Investment & Banking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Asset Classes:</strong>{' '}
                      {selectedApplication.preferred_asset_class?.length
                        ? selectedApplication.preferred_asset_class.join(', ')
                        : '-'}
                    </p>
                    <p><strong>Investment Range:</strong> {selectedApplication.investment_range || '-'}</p>
                    <p><strong>Preferred Currency:</strong> {selectedApplication.preferred_currency || '-'}</p>
                    <p><strong>Bank Name:</strong> {selectedApplication.bank_name || '-'}</p>
                    <p><strong>Account Holder:</strong> {selectedApplication.bank_account_holder || '-'}</p>
                    <p><strong>Account / IBAN:</strong> {selectedApplication.bank_account_number || '-'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      KYC & Legal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>KYC Upload Preference:</strong> {selectedApplication.kyc_upload_preference || '-'}</p>
                    <p><strong>Terms Accepted:</strong> {selectedApplication.terms_accepted ? 'Yes' : 'No'}</p>
                    <p>
                      <strong>Terms Accepted At:</strong>{' '}
                      {selectedApplication.terms_accepted_at
                        ? new Date(selectedApplication.terms_accepted_at).toLocaleString('en-GB')
                        : '-'}
                    </p>
                    <p>
                      <strong>Digital Signature Acknowledged:</strong>{' '}
                      {selectedApplication.digital_signature_acknowledged ? 'Yes' : 'No'}
                    </p>
                    <p><strong>Submitted At:</strong> {new Date(selectedApplication.created_at).toLocaleString('en-GB')}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedApplication.account_type === 'joint' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Joint Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Investment Decision Rights:</strong>{' '}
                      {selectedApplication.joint_investment_decision_rights || '-'}
                    </p>
                    <p>
                      <strong>Disbursement Rights:</strong>{' '}
                      {selectedApplication.joint_dispersement_rights || '-'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedApplication.account_type === 'corporate' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Corporate Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Company Name:</strong> {selectedApplication.corporate_company_name || '-'}</p>
                    <p><strong>Domicile:</strong> {selectedApplication.corporate_domicile || '-'}</p>
                    <p>
                      <strong>Registration Number:</strong>{' '}
                      {selectedApplication.corporate_registration_number || '-'}
                    </p>
                    <p>
                      <strong>Nature of Business:</strong>{' '}
                      {selectedApplication.corporate_nature_of_business || '-'}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Related Holders / Directors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No related holders found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Nationality</TableHead>
                          <TableHead>Director Title</TableHead>
                          <TableHead>Beneficial Owner</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holders.map((holder) => (
                          <TableRow key={holder.id}>
                            <TableCell>{holder.holder_type}</TableCell>
                            <TableCell>{holder.first_name} {holder.last_name}</TableCell>
                            <TableCell>{holder.email || '-'}</TableCell>
                            <TableCell>{holder.phone || '-'}</TableCell>
                            <TableCell>{holder.nationality || '-'}</TableCell>
                            <TableCell>{holder.director_title || '-'}</TableCell>
                            <TableCell>{holder.is_beneficial_owner ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!signature ? (
                    <p className="text-sm text-muted-foreground">No signature found.</p>
                  ) : (
                    <>
                      <p className="text-sm"><strong>Signature Type:</strong> {signature.signature_type}</p>
                      <div className="rounded-md border p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2">Stored signature data preview</p>
                        <div className="break-all text-xs max-h-32 overflow-auto">
                          {signature.signature_data}
                        </div>
                      </div>
                      <div className="text-sm">
                        <strong>Legal Acknowledgments:</strong>
                        {signature.legal_acknowledgments?.length ? (
                          <ul className="list-disc ml-5 mt-2 space-y-1">
                            {signature.legal_acknowledgments.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <span> -</span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end flex-wrap">
                <Button
                  onClick={() => approveApplication(selectedApplication)}
                  disabled={processing || selectedApplication.status === 'APPROVED' || selectedApplication.status === 'PORTAL_CREATED'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>

                <Button
                  variant="outline"
                  onClick={() => openStatusDialog(selectedApplication)}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the application workflow status for internal tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {targetApplication && (
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p><strong>Applicant:</strong> {getDisplayName(targetApplication)}</p>
                <p><strong>Email:</strong> {targetApplication.email || '-'}</p>
                <p><strong>Current Status:</strong> {targetApplication.status || 'PENDING'}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="UNDER_REVIEW">UNDER_REVIEW</SelectItem>
                  <SelectItem value="PORTAL_CREATED">PORTAL_CREATED</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Internal note for this status update..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={updateStatus} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}