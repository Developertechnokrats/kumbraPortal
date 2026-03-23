'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Send, ArrowLeft, Loader2, Inbox, ExternalLink, Paperclip } from 'lucide-react';

interface InboundEmail {
  id: string;
  to_address: string;
  from_address: string;
  from_name: string;
  subject: string;
  text_body: string;
  html_body: string;
  attachments_json: any;
  is_read: boolean;
  client_id: string | null;
  created_at: string;
}

export default function AdminMessagesPage() {
  const { profile } = useAuth();
  const [inboundEmails, setInboundEmails] = useState<InboundEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadInboundEmails();
  }, []);

  const loadInboundEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inbound_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInboundEmails(data || []);
    } catch (error) {
      console.error('Error loading inbound emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await (supabase as any)
        .from('inbound_emails')
        .update({ is_read: true })
        .eq('id', emailId);

      setInboundEmails(prev =>
        prev.map(email =>
          email.id === emailId ? { ...email, is_read: true } : email
        )
      );
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleSelectEmail = (email: InboundEmail) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      markAsRead(email.id);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) {
      alert('Please enter a reply message');
      return;
    }

    try {
      setSending(true);
      alert('Email reply functionality requires SendGrid API integration. For now, you can copy the sender address and reply manually: ' + selectedEmail.from_address);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = inboundEmails.filter(e => !e.is_read).length;
  const todayCount = inboundEmails.filter(e => {
    const today = new Date().toDateString();
    return new Date(e.created_at).toDateString() === today;
  }).length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
        <p className="text-muted-foreground mt-1">All incoming emails to *@kumbracapital.com</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inboundEmails.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Inbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : inboundEmails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No emails yet</p>
                    <p className="text-xs mt-2">Configure SendGrid Inbound Parse to start receiving emails</p>
                  </div>
                ) : (
                  inboundEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        !email.is_read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      } ${selectedEmail?.id === email.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {!email.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className="font-semibold text-sm truncate">
                            {email.from_name || email.from_address}
                          </span>
                        </div>
                        {email.attachments_json && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        To: {email.to_address}
                      </div>
                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                        {email.subject || '(No Subject)'}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {email.text_body?.substring(0, 100)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(email.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedEmail ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <CardTitle>Email Details</CardTitle>
              </div>
            ) : (
              <CardTitle>Select an email</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {selectedEmail ? (
              <div className="space-y-6">
                <div className="border-b pb-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h2 className="text-2xl font-bold">{selectedEmail.subject || '(No Subject)'}</h2>
                    {!selectedEmail.is_read && (
                      <Badge variant="default">New</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium">
                        {selectedEmail.from_name && `${selectedEmail.from_name} `}
                        &lt;{selectedEmail.from_address}&gt;
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-medium">{selectedEmail.to_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedEmail.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {selectedEmail.attachments_json && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attachments:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {Array.isArray(selectedEmail.attachments_json) ? selectedEmail.attachments_json.length : 0} file(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="text" className="w-full">
                  <TabsList>
                    <TabsTrigger value="text">Plain Text</TabsTrigger>
                    {selectedEmail.html_body && (
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="text">
                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedEmail.text_body || '(No text content)'}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  {selectedEmail.html_body && (
                    <TabsContent value="html">
                      <ScrollArea className="h-[300px] border rounded-lg p-4">
                        <div
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                        />
                      </ScrollArea>
                    </TabsContent>
                  )}
                </Tabs>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Quick Reply</h3>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${selectedEmail.from_address}?subject=Re: ${selectedEmail.subject}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Email Client
                      </a>
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={6}
                  />
                  <Button onClick={handleSendReply} disabled={sending} className="w-full" size="lg">
                    {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply (via SendGrid)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select an email from the inbox to view details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
