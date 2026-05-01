'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Upload, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { client, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    type: 'OTHER',
    title: '',
    file_url: '',
  });

  useEffect(() => {
    if (!authLoading && client) {
      loadDocuments();
    }
  }, [client, authLoading]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', client!.id)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingFile(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${client!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error('Error uploading file: ' + uploadError.message);
        return;
      }

      setFormData({...formData, file_url: filePath, title: formData.title || file.name});
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file: ' + error.message);
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
  if (!formData.title) {
    toast.error('Please enter a document title');
    return;
  }

  if (!formData.file_url) {
    toast.error('Please upload a file');
    return;
  }

  try {
    setUploading(true);

    const documentType =
      formData.type.startsWith('KYC')
        ? 'KYC'
        : formData.type.startsWith('AGREEMENT')
        ? 'AGREEMENT'
        : formData.type.startsWith('OTHER')
        ? 'OTHER'
        : formData.type;

    const { error: insertError } = await (supabase.from('documents') as any).insert({
      client_id: client!.id,
      type: documentType,
      title: formData.title,
      file_url: formData.file_url,
      file_size: 256000,
      uploaded_by: profile?.id,
      status: 'PENDING',
      requires_signature: false,
    });

    if (insertError) {
      throw insertError;
    }

    toast.success('Document uploaded successfully!');
    setIsUploadOpen(false);
    setFormData({
      type: 'OTHER',
      title: '',
      file_url: '',
    });

    await loadDocuments();
  } catch (error: any) {
    console.error('Error uploading document:', error);
    toast.error('Error uploading document: ' + error.message);
  } finally {
    setUploading(false);
  }
};

  const handleViewDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(doc.file_url, 3600);

      if (error) {
        console.error('Error getting signed URL:', error);
        toast.error('Error viewing document');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error('Error viewing document:', error);
      toast.error('Error viewing document');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SIGNED') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    if (status === 'NEEDS_SIGNATURE') return <AlertCircle className="h-5 w-5 text-amber-500" />;
    return <Clock className="h-5 w-5 text-sky-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'SIGNED') return 'border-emerald-500';
    if (status === 'NEEDS_SIGNATURE') return 'border-amber-500';
    return 'border-sky-500';
  };

  if (loading || authLoading) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 rounded-lg" />
      ))}
    </div>
  );
}

  const kycPending = documents.filter(d => d.status === 'PENDING');
  const approvedDocs = documents.filter(d => d.status === 'APPROVED');
  const rejectedDocs = documents.filter(d => d.status === 'REJECTED');
  const getStatusBadge = (status: string) => {
  if (status === 'APPROVED') return 'bg-green-100 text-green-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
};
  const completedDocs = documents.filter(d => d.status !== 'NEEDS_SIGNATURE');
  const pendingDocs = documents.filter(d => d.status === 'NEEDS_SIGNATURE');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Documents</h1>
          <p className="text-slate-600 mt-1">Access statements, agreements, and important documents</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} size="lg">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {pendingDocs.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Action Required ({pendingDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-amber-600" />
                  <div>
                    <h3 className="font-semibold">{doc.title}</h3>
                    <p className="text-sm text-slate-600">{new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => handleViewDocument(doc)}>View & Sign</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {completedDocs.map(doc => (
          <Card key={doc.id} className={`border-l-4 ${getStatusColor(doc.status)} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <FileText className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{doc.title}</h3>
                      {getStatusIcon(doc.status)}
                      <Badge variant="outline">{doc.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-600">
                      <span>{new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-slate-600 mb-4">Upload your first document to get started</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="KYC_PASSPORT">Passport</SelectItem>
                    <SelectItem value="KYC_ID_CARD">ID Card</SelectItem>
                    <SelectItem value="KYC_UTILITY_BILL">Utility Bill</SelectItem>
                    <SelectItem value="STATEMENT">Bank Statement</SelectItem>
                    <SelectItem value="AGREEMENT_CORPORATE">Corporate Document</SelectItem>
                    <SelectItem value="AGREEMENT_SIGNED">Signed Agreement</SelectItem>
                    <SelectItem value="OTHER_BANK_TRANSFER">Bank Transfer Confirmation</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                  </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Title *</Label>
              <Input
                placeholder="e.g., Passport Copy, Bank Statement Dec 2024"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                      <p className="text-sm text-emerald-600 font-medium">File uploaded successfully</p>
                      <p className="text-xs text-muted-foreground">Click or drag to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & drop your file here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-2">PDF, Word, Excel, or Images (Max 50MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploading || uploadingFile}>
              {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
