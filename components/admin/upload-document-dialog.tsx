'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function UploadDocumentDialog({ open, onOpenChange, clientId, onSuccess }: UploadDocumentDialogProps) {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    type: 'CONTRACT_NOTE',
    title: '',
    file_url: '',
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploadingFile(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        alert('Error uploading file: ' + uploadError.message);
        return;
      }

      setFormData({...formData, file_url: filePath, title: formData.title || file.name});
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.file_url) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      const { error } = await (supabase as any)
        .from('documents')
        .insert({
          client_id: clientId,
          type: formData.type,
          title: formData.title,
          file_url: formData.file_url,
          status: 'AVAILABLE',
          requires_signature: false,
          uploaded_by: profile?.id,
        });

      if (error) throw error;

      alert('Document uploaded successfully!');
      onSuccess();
      onOpenChange(false);
      setFormData({
        type: 'CONTRACT_NOTE',
        title: '',
        file_url: '',
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      alert('Error uploading document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTRACT_NOTE">Contract Note</SelectItem>
                <SelectItem value="AGREEMENT">Signed BPA</SelectItem>
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
                    <p className="text-xs text-muted-foreground mt-2">PDF, Word, Excel, or Images</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
