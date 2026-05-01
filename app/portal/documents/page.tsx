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

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${client!.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (error) {
        toast.error(error.message);
        return;
      }

      setFormData({
        ...formData,
        file_url: filePath,
        title: formData.title || file.name,
      });

      toast.success('File uploaded successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!formData.title || !formData.file_url) {
      toast.error('Missing fields');
      return;
    }

    try {
      setUploading(true);

      const type =
        formData.type.startsWith('KYC')
          ? 'KYC'
          : formData.type.startsWith('AGREEMENT')
          ? 'AGREEMENT'
          : formData.type.startsWith('OTHER')
          ? 'OTHER'
          : formData.type;

      const { error } = await supabase.from('documents').insert({
        client_id: client!.id,
        type,
        title: formData.title,
        file_url: formData.file_url,
        file_size: 256000,
        uploaded_by: profile?.id,
        status: 'PENDING',
      });

      if (error) throw error;

      toast.success('Uploaded successfully');
      setIsUploadOpen(false);
      setFormData({ type: 'OTHER', title: '', file_url: '' });
      loadDocuments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (doc: any) => {
    const { data } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(doc.file_url, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl);
    }
  };

  // ✅ STATUS UI FIXED
  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'REJECTED') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-amber-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED') return 'border-green-500';
    if (status === 'REJECTED') return 'border-red-500';
    return 'border-amber-500';
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h1 className="text-4xl font-bold">Documents</h1>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
      </div>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className={`border-l-4 ${getStatusColor(doc.status)}`}>
            <CardContent className="p-6 flex justify-between">
              <div>
                <h3>{doc.title}</h3>
                <div className="flex gap-2">
                  {getStatusIcon(doc.status)}
                  <Badge>{doc.status}</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleViewDocument(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleViewDocument(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <input type="file" onChange={(e) => handleFileUpload(e.target.files![0])} />

          <DialogFooter>
            <Button onClick={handleUploadDocument} disabled={uploading}>
              {uploading && <Loader2 className="animate-spin mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}