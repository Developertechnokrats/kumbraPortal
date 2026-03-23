'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Phone, ArrowUpCircle, Loader2, AlertCircle, RefreshCw, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';
import { useToast } from '@/hooks/use-toast';

interface ClientRequest {
  id: string;
  client_id: string;
  client_name: string;
  request_type: string;
  status: string;
  subject: string;
  details: string | null;
  preferred_datetime: string | null;
  amount: number | null;
  currency: string | null;
  handled_by: string | null;
  handled_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function ClientRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);

      const { data: clientsData } = await (supabase as any)
        .from('clients')
        .select('id, user_id')
        .eq('archived', false);

      const clientIds = (clientsData || []).map((c: any) => c.user_id);

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.name]));
      const clientIdToName = new Map((clientsData || []).map((c: any) => [c.id, profileMap.get(c.user_id) || 'Unknown']));

      const { data: requestsData, error } = await (supabase as any)
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithNames: ClientRequest[] = (requestsData || []).map((r: any) => ({
        ...r,
        client_name: clientIdToName.get(r.client_id) || 'Unknown'
      }));

      setRequests(requestsWithNames);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load client requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'complete' | 'reject' | 'in_progress') => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newStatus = action === 'complete' ? 'COMPLETED' : action === 'reject' ? 'REJECTED' : 'IN_PROGRESS';

      const { error } = await (supabase as any)
        .from('client_requests')
        .update({
          status: newStatus,
          handled_by: user.id,
          handled_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: action === 'complete' ? 'Request Completed' : action === 'reject' ? 'Request Rejected' : 'Status Updated',
        description: `The request has been marked as ${newStatus.toLowerCase().replace('_', ' ')}`,
      });

      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
      loadRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL_REQUEST':
        return <Phone className="h-4 w-4 text-cyan-600" />;
      case 'WITHDRAWAL_REQUEST':
        return <ArrowUpCircle className="h-4 w-4 text-blue-600" />;
      case 'GENERAL_INQUIRY':
        return <MessageSquare className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CALL_REQUEST': 'Call Request',
      'WITHDRAWAL_REQUEST': 'Withdrawal',
      'GENERAL_INQUIRY': 'Inquiry',
      'DOCUMENT_REQUEST': 'Document',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Loader2 className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const inProgressRequests = requests.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = requests.filter(r => r.status === 'COMPLETED');
  const callRequests = requests.filter(r => r.request_type === 'CALL_REQUEST');
  const withdrawalRequests = requests.filter(r => r.request_type === 'WITHDRAWAL_REQUEST');

  const pendingCallRequests = callRequests.filter(r => r.status === 'PENDING');
  const pendingWithdrawalRequests = withdrawalRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Requests</h1>
          <p className="text-muted-foreground mt-1">Manage call requests, withdrawals, and inquiries</p>
        </div>
        <Button variant="outline" onClick={loadRequests}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Call Requests</CardTitle>
            <Phone className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600">{pendingCallRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending callbacks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{pendingWithdrawalRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending withdrawals</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calls">
            Call Requests
            {pendingCallRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingCallRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Withdrawals
            {pendingWithdrawalRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingWithdrawalRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Requests awaiting your action</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Preferred Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{request.client_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.request_type)}
                            {getTypeLabel(request.request_type)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.subject}</TableCell>
                        <TableCell>
                          {request.preferred_datetime ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.preferred_datetime), 'dd MMM HH:mm')}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {request.amount ? (
                            <span className="font-medium">{formatCurrency(request.amount, request.currency || 'GBP')}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType('complete');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
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
        </TabsContent>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Call Requests</CardTitle>
              <CardDescription>Clients requesting a callback from their advisor</CardDescription>
            </CardHeader>
            <CardContent>
              {callRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No call requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Preferred Time</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{request.client_name}</TableCell>
                        <TableCell>{request.subject.replace('Call Request: ', '')}</TableCell>
                        <TableCell>
                          {request.preferred_datetime ? (
                            <div className="flex items-center gap-1 text-sm font-medium text-cyan-600">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.preferred_datetime), 'dd MMM yyyy HH:mm')}
                            </div>
                          ) : <span className="text-muted-foreground">Any time</span>}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.details || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType('complete');
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Called
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>Client withdrawal requests requiring processing</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowUpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No withdrawal requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Bank Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                        <TableCell className="font-medium">{request.client_name}</TableCell>
                        <TableCell className="font-bold text-red-600">
                          -{formatCurrency(request.amount || 0, request.currency || 'GBP')}
                        </TableCell>
                        <TableCell><Badge variant="outline">{request.currency}</Badge></TableCell>
                        <TableCell className="text-sm">{request.details || '-'}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionType('complete');
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Process
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionType('reject');
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
              <CardDescription>Complete request history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.slice(0, 50).map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{format(new Date(request.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{request.client_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.request_type)}
                          {getTypeLabel(request.request_type)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{request.subject}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.handled_at ? format(new Date(request.handled_at), 'dd MMM yyyy HH:mm') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes('');
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'complete' ? 'Complete Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'complete'
                ? 'Mark this request as completed.'
                : 'Mark this request as rejected.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <span className="font-medium">{selectedRequest.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Request Type:</span>
                  <span className="font-medium">{getTypeLabel(selectedRequest.request_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subject:</span>
                  <span className="font-medium">{selectedRequest.subject}</span>
                </div>
                {selectedRequest.amount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-bold">{formatCurrency(selectedRequest.amount, selectedRequest.currency || 'GBP')}</span>
                  </div>
                )}
                {selectedRequest.preferred_datetime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Preferred Time:</span>
                    <span>{format(new Date(selectedRequest.preferred_datetime), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                )}
                {selectedRequest.details && (
                  <div className="border-t pt-3 mt-3">
                    <span className="text-sm text-muted-foreground block mb-1">Details:</span>
                    <p className="text-sm">{selectedRequest.details}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes about this request..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setAdminNotes('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'complete' ? 'default' : 'destructive'}
              onClick={() => handleAction(actionType!)}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'complete' ? 'Mark as Completed' : 'Mark as Rejected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
