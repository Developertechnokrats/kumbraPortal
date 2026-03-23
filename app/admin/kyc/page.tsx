'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, FileText, Loader2, Eye } from 'lucide-react';

export default function KYCPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          client:clients!inner(
            profile:profiles!clients_user_id_fkey(name)
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;

    try {
      setProcessing(true);

      await (supabase.from('kyc_documents') as any).update({
        status: 'APPROVED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id
      }).eq('id', selectedDoc.id);

      const { data: clientDocs } = await supabase
        .from('kyc_documents')
        .select('status')
        .eq('client_id', selectedDoc.client_id);

      const allApproved = clientDocs?.every((d: any) => d.status === 'APPROVED');

      if (allApproved) {
        await (supabase.from('clients') as any).update({
          kyc_status: 'APPROVED'
        }).eq('id', selectedDoc.client_id);
      }

      await (supabase.from('audit_logs') as any).insert({
        user_id: profile?.id,
        action: 'APPROVE_KYC',
        entity_type: 'KYC_DOCUMENT',
        entity_id: selectedDoc.id,
        changes: {
          client_name: (selectedDoc.client as any).profile.name,
          document_type: selectedDoc.document_type
        }
      });

      setSelectedDoc(null);
      setActionType(null);
      loadDocuments();
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Error approving document');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);

      await (supabase.from('kyc_documents') as any).update({
        status: 'REJECTED',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
        rejection_reason: rejectionReason
      }).eq('id', selectedDoc.id);

      await (supabase.from('audit_logs') as any).insert({
        user_id: profile?.id,
        action: 'REJECT_KYC',
        entity_type: 'KYC_DOCUMENT',
        entity_id: selectedDoc.id,
        changes: {
          client_name: (selectedDoc.client as any).profile.name,
          document_type: selectedDoc.document_type,
          reason: rejectionReason
        }
      });

      setSelectedDoc(null);
      setActionType(null);
      setRejectionReason('');
      loadDocuments();
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Error rejecting document');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingDocs = documents.filter(d => d.status === 'PENDING');
  const processedDocs = documents.filter(d => d.status !== 'PENDING');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYC Document Approval</h1>
        <p className="text-muted-foreground mt-1">Review and approve client identification documents</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingDocs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {documents.filter(d => d.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {documents.filter(d => d.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending KYC documents</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="font-medium">{(doc.client as any).profile.name}</TableCell>
                    <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{doc.file_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.document_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedDoc(doc);
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
                            setSelectedDoc(doc);
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

      <Card>
        <CardHeader>
          <CardTitle>Processed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedDocs.slice(0, 10).map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(doc.reviewed_at || doc.uploaded_at).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell className="font-medium">{(doc.client as any).profile.name}</TableCell>
                  <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">Admin</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDoc && !!actionType} onOpenChange={() => {
        setSelectedDoc(null);
        setActionType(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve KYC Document' : 'Reject KYC Document'}
            </DialogTitle>
          </DialogHeader>

          {actionType === 'approve' ? (
            <div className="py-4">
              <p className="text-sm">
                Client: <strong>{selectedDoc && (selectedDoc.client as any).profile.name}</strong><br />
                Document: <strong>{selectedDoc?.document_type}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm">
                Client: <strong>{selectedDoc && (selectedDoc.client as any).profile.name}</strong><br />
                Document: <strong>{selectedDoc?.document_type}</strong>
              </p>
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Explain why this document is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDoc(null);
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
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Approve Document' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
