'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, UserX, UserCheck, Trash2, Loader2, Shield, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClientAccountActionsProps {
  clientId: string;
  clientName: string;
  currentStatus: string;
  onSuccess: () => void;
}

export function ClientAccountActions({ clientId, clientName, currentStatus, onSuccess }: ClientAccountActionsProps) {
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [actionType, setActionType] = useState<'SUSPEND' | 'REACTIVATE' | 'DELETE' | 'HISTORY' | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleAction = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    try {
      setProcessing(true);

      let newStatus = currentStatus;
      if (actionType === 'SUSPEND') newStatus = 'SUSPENDED';
      if (actionType === 'REACTIVATE') newStatus = 'ACTIVE';
      if (actionType === 'DELETE') newStatus = 'DELETED';

      const { error: rpcError } = await (supabase.rpc as any)('update_account_status', {
        p_client_id: clientId,
        p_new_status: newStatus,
        p_reason: reason,
        p_notes: notes || null
      });

      if (rpcError) throw rpcError;

      alert(`Account ${actionType?.toLowerCase()}ed successfully!`);
      setActionType(null);
      setReason('');
      setNotes('');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating account status:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data } = await supabase
        .from('account_status_history')
        .select('*, changed_by_profile:profiles!account_status_history_changed_by_fkey(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      setStatusHistory(data || []);
      setActionType('HISTORY');
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Suspended</Badge>;
      case 'DELETED':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={loadHistory}>
            <History className="h-4 w-4 mr-2" />
            View Status History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {currentStatus === 'ACTIVE' && (
            <DropdownMenuItem onClick={() => setActionType('SUSPEND')} className="text-amber-600">
              <UserX className="h-4 w-4 mr-2" />
              Suspend Account
            </DropdownMenuItem>
          )}
          {currentStatus === 'SUSPENDED' && (
            <DropdownMenuItem onClick={() => setActionType('REACTIVATE')} className="text-emerald-600">
              <UserCheck className="h-4 w-4 mr-2" />
              Reactivate Account
            </DropdownMenuItem>
          )}
          {currentStatus !== 'DELETED' && (
            <DropdownMenuItem onClick={() => setActionType('DELETE')} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={actionType === 'SUSPEND' || actionType === 'REACTIVATE' || actionType === 'DELETE'} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'SUSPEND' && 'Suspend Client Account'}
              {actionType === 'REACTIVATE' && 'Reactivate Client Account'}
              {actionType === 'DELETE' && 'Delete Client Account'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <p>
                  {actionType === 'SUSPEND' && `Are you sure you want to suspend ${clientName}'s account? They will not be able to access the portal.`}
                  {actionType === 'REACTIVATE' && `Are you sure you want to reactivate ${clientName}'s account? They will regain access to the portal.`}
                  {actionType === 'DELETE' && `Are you sure you want to delete ${clientName}'s account? This is a soft delete - all data will be retained for compliance but the account will be marked as deleted.`}
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter the reason for this action..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional details..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    This action will be permanently logged in the audit trail and cannot be undone.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={processing || !reason.trim()}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'SUSPEND' && 'Suspend Account'}
              {actionType === 'REACTIVATE' && 'Reactivate Account'}
              {actionType === 'DELETE' && 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={actionType === 'HISTORY'} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Account Status History - {clientName}</DialogTitle>
            <DialogDescription>
              Complete audit trail of all account status changes (immutable records)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : statusHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No status changes recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statusHistory.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.old_status)}
                          <span className="text-muted-foreground">→</span>
                          {getStatusBadge(record.new_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Changed by: {(record.changed_by_profile as any)?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(record.created_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Reason:</strong> {record.reason}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
