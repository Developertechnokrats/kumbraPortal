'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, Eye, Trash2 } from 'lucide-react';

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    type: 'CONTRACT_NOTE',
    title: '',
    file_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [docsRes, clientsRes] = await Promise.all([
        supabase
          .from('documents')
          .select(`
            *,
            client:clients!inner(profile:profiles!clients_user_id_fkey(name))
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, profile:profiles!clients_user_id_fkey(name)')
      ]);

      setDocuments(docsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalKyc = documents.filter(d => d.type?.startsWith('KYC')).length;
  const approvedKyc = documents.filter(d => d.type?.startsWith('KYC') && d.status === 'APPROVED').length;
  const pendingKyc = documents.filter(d => d.type?.startsWith('KYC') && d.status === 'PENDING').length;
  const rejectedKyc = documents.filter(d => d.type?.startsWith('KYC') && d.status === 'REJECTED').length;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!formData.client_id) {
      alert('Please select a client first');
      return;
    }

    try {
      setUploadingFile(true);

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${formData.client_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      setFormData({
        ...formData,
        file_url: filePath,
        title: formData.title || file.name,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleUploadDocument = async () => {
    if (!formData.client_id || !formData.title) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.file_url) {
      alert('Please upload a document file');
      return;
    }

    try {
      setProcessing(true);

      const client = clients.find(c => c.id === formData.client_id);

      const uploadStatus = formData.type === 'KYC' ? 'PENDING' : 'AVAILABLE';

      const { error: insertError } = await (supabase.from('documents') as any).insert({
        client_id: formData.client_id,
        type: formData.type,
        title: formData.title,
        file_url: formData.file_url,
        file_size: 256000,
        uploaded_by: profile?.id,
        status: uploadStatus,
        requires_signature: false,
      });

      if (insertError) throw insertError;

      await (supabase.from('audit_logs') as any).insert({
        actor_id: profile?.id,
        action: 'UPLOAD_DOCUMENT',
        entity: 'DOCUMENT',
        entity_id: formData.client_id,
        after_json: {
          client_name: (client as any)?.profile?.name || 'Unknown',
          document_title: formData.title,
          document_type: formData.type,
          status: uploadStatus,
        },
      });

      alert('Document uploaded successfully!');

      setIsUploadOpen(false);
      setFormData({
        client_id: '',
        type: 'CONTRACT_NOTE',
        title: '',
        file_url: '',
      });

      loadData();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert('Error uploading document: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(doc.file_url, 3600);

      if (error) {
        alert('Error viewing document: ' + error.message);
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing document:', error);
      alert('Error viewing document: ' + error.message);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      await supabase.from('documents').delete().eq('id', doc.id);

      await (supabase.from('audit_logs') as any).insert({
        actor_id: profile?.id,
        action: 'DELETE_DOCUMENT',
        entity: 'DOCUMENT',
        entity_id: doc.id,
        after_json: {
          client_name: (doc.client as any)?.profile?.name || 'Unknown',
          document_title: doc.title,
        },
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  const handleApproveKYC = async (doc: any) => {
    if (!confirm(`Approve KYC document for ${(doc.client as any)?.profile?.name || 'this client'}?`)) return;

    try {
      setProcessing(true);

      const { error: docError } = await (supabase.from('documents') as any)
        .update({
          status: 'APPROVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (docError) throw docError;

      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', doc.client_id);

      if (allDocsError) throw allDocsError;

      const kycDocs = (allDocs || []).filter((d: any) => d.type?.startsWith('KYC'));
      const allKycApproved =
        kycDocs.length > 0 && kycDocs.every((d: any) => d.status === 'APPROVED');

      if (allKycApproved) {
        const { error: clientError } = await (supabase.from('clients') as any)
          .update({
            kyc_status: 'APPROVED',
            kyc_documents_approved: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', doc.client_id);

        if (clientError) throw clientError;
      }

      await (supabase.from('audit_logs') as any).insert({
        actor_id: profile?.id,
        action: 'APPROVE_KYC',
        entity: 'CLIENT',
        entity_id: doc.client_id,
        after_json: {
          client_name: (doc.client as any)?.profile?.name || 'Unknown',
          document_title: doc.title,
          all_kyc_approved: allKycApproved,
        },
      });

      alert(
        allKycApproved
          ? 'KYC document approved. Client KYC is now fully approved.'
          : 'KYC document approved. Other KYC documents may still need review.'
      );

      loadData();
    } catch (error: any) {
      console.error('Error approving KYC:', error);
      alert('Error approving KYC: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectKYC = async (doc: any) => {
    if (!confirm(`Reject KYC document for ${(doc.client as any)?.profile?.name || 'this client'}?`)) return;

    try {
      setProcessing(true);

      const { error: docError } = await (supabase.from('documents') as any)
        .update({
          status: 'REJECTED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (docError) throw docError;

      const { error: clientError } = await (supabase.from('clients') as any)
        .update({
          kyc_status: 'REJECTED',
          kyc_documents_approved: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.client_id);

      if (clientError) throw clientError;

      await (supabase.from('audit_logs') as any).insert({
        actor_id: profile?.id,
        action: 'REJECT_KYC',
        entity: 'CLIENT',
        entity_id: doc.client_id,
        after_json: {
          client_name: (doc.client as any)?.profile?.name || 'Unknown',
          document_title: doc.title,
        },
      });

      alert('KYC rejected');
      loadData();
    } catch (error: any) {
      console.error('Error rejecting KYC:', error);
      alert('Error rejecting KYC: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getDocTypeBadge = (type: string) => {
    const colors: any = {
      CONTRACT_NOTE: 'bg-blue-100 text-blue-700',
      AGREEMENT: 'bg-emerald-100 text-emerald-700',
      STATEMENT: 'bg-amber-100 text-amber-700',
      KYC: 'bg-purple-100 text-purple-700',
      OTHER: 'bg-gray-100 text-gray-700',
    };

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>
        {type?.replace(/_/g, ' ') || 'UNKNOWN'}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const className =
      status === 'APPROVED'
        ? 'bg-green-100 text-green-700'
        : status === 'REJECTED'
        ? 'bg-red-100 text-red-700'
        : status === 'PENDING'
        ? 'bg-yellow-100 text-yellow-700'
        : status === 'AVAILABLE'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-700';

    return <Badge className={className}>{status}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage client documents</p>
        </div>

        <Button onClick={() => setIsUploadOpen(true)} size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contract Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {documents.filter(d => d.type === 'CONTRACT_NOTE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {documents.filter(d => d.type === 'AGREEMENT').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KYC Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {approvedKyc}/{totalKyc}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingKyc} pending | {rejectedKyc} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => {
                const docDate = new Date(d.created_at);
                const now = new Date();
                return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
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
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(doc.created_at).toLocaleDateString('en-GB')}
                    </TableCell>

                    <TableCell className="font-medium">
                      {(doc.client as any)?.profile?.name || 'Unknown'}
                    </TableCell>

                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{getDocTypeBadge(doc.type)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {doc.type?.startsWith('KYC') && doc.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveKYC(doc)}
                              disabled={processing}
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectKYC(doc)}
                              disabled={processing}
                              className="text-red-600"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(v) => setFormData({ ...formData, client_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>

                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(c as any)?.profile?.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="CONTRACT_NOTE">Contract Note</SelectItem>
                  <SelectItem value="AGREEMENT">Agreement / Bond Certificate</SelectItem>
                  <SelectItem value="STATEMENT">Statement</SelectItem>
                  <SelectItem value="KYC">KYC Document</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Title *</Label>
              <Input
                placeholder="e.g., ANZ Bond Contract Note"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Upload File *</Label>

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                />

                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading file...</span>
                    </div>
                  ) : formData.file_url ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-emerald-500" />
                      <p className="text-sm text-emerald-600 font-medium">
                        File uploaded successfully
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click or drag to change file
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & drop your file here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        PDF, Word, Excel, or Images
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {!formData.client_id && (
                <p className="text-xs text-amber-600">
                  Please select a client first before uploading
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>

            <Button onClick={handleUploadDocument} disabled={processing || uploadingFile}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}