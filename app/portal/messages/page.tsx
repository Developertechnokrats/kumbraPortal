'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Send, Inbox, Star, Trash2, Plus, ArrowLeft, Paperclip, Search } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  attachments?: string[];
}

export default function SecureMailPage() {
  const { client } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  const messages: Message[] = [
    {
      id: '1',
      from: 'Sarah Chen - Portfolio Manager',
      subject: 'Your Q4 2025 Performance Review',
      preview: 'Your portfolio has performed exceptionally well this quarter with a 12.3% return...',
      body: 'Dear James,\n\nI hope this message finds you well.\n\nYour portfolio has performed exceptionally well this quarter with a 12.3% return, outperforming our benchmark by 2.8%. The strong performance was primarily driven by your positions in technology equities and our Asia Select Fund.\n\nI would like to schedule a call next week to discuss potential rebalancing opportunities and review your investment goals for 2026.\n\nBest regards,\nSarah Chen\nPortfolio Manager',
      date: '2025-11-10T14:30:00',
      read: false,
      starred: true,
      attachments: ['Q4_Performance_Report.pdf', 'Portfolio_Analysis.xlsx']
    },
    {
      id: '2',
      from: 'Compliance Team',
      subject: 'Annual KYC Update Required',
      preview: 'As part of our regulatory requirements, we need to update your Know Your Client information...',
      body: 'Dear Valued Client,\n\nAs part of our regulatory requirements, we need to update your Know Your Client (KYC) information annually.\n\nPlease log into your portal and navigate to Profile > Verification to complete this process. This should take no more than 5 minutes.\n\nThank you for your cooperation.\n\nCompliance Team',
      date: '2025-11-09T09:15:00',
      read: false,
      starred: false
    },
    {
      id: '3',
      from: 'Operations Team',
      subject: 'Deposit Confirmation - GBP 50,000',
      preview: 'We have received and processed your deposit of GBP 50,000...',
      body: 'Dear James,\n\nWe have received and processed your deposit of GBP 50,000 via bank transfer.\n\nThe funds are now available in your account and ready for investment.\n\nTransaction ID: TXN20251108-4521\nDeposit Date: 8 November 2025\nAmount: GBP 50,000.00\n\nIf you have any questions, please don\'t hesitate to reach out.\n\nBest regards,\nOperations Team',
      date: '2025-11-08T16:45:00',
      read: true,
      starred: false
    },
    {
      id: '4',
      from: 'Marcus Williams - Investment Analyst',
      subject: 'New Bond Opportunity - HSBC 5.85%',
      preview: 'I wanted to bring to your attention a new bond offering that aligns with your risk profile...',
      body: 'Hi James,\n\nI wanted to bring to your attention a new bond offering that aligns with your risk profile:\n\nHSBC Holdings PLC 5.85% maturing 15 August 2035\n- Credit Rating: AA- (S&P)\n- Semi-Annual Payments\n- Minimum Investment: $10,000\n\nGiven your preference for quality bank paper and fixed income exposure, this could be a good addition to your portfolio.\n\nLet me know if you\'d like to discuss further.\n\nBest,\nMarcus Williams',
      date: '2025-11-07T11:20:00',
      read: true,
      starred: true,
      attachments: ['NAB_Bond_Details.pdf']
    },
    {
      id: '5',
      from: 'Kumbra Capital',
      subject: 'Monthly Market Update - November 2025',
      preview: 'Global markets showed resilience in October despite geopolitical concerns...',
      body: 'Monthly Market Update - November 2025\n\nGlobal markets showed resilience in October despite geopolitical concerns. Key highlights:\n\n- S&P 500: +3.2%\n- FTSE 100: +2.1%\n- Gold: +1.8%\n- GBP/USD: Stable at 1.27\n\nOur outlook remains cautiously optimistic heading into year-end.\n\nFull report attached.\n\nKumbra Capital Research Team',
      date: '2025-11-01T08:00:00',
      read: true,
      starred: false,
      attachments: ['Market_Update_Nov_2025.pdf']
    }
  ];

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread' && msg.read) return false;
    if (filter === 'starred' && !msg.starred) return false;
    if (searchQuery && !msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !msg.from.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Secure Internal Mail</h1>
          <p className="text-muted-foreground mt-1">Private communication with your investment team</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="text-lg px-3 py-1">{unreadCount} Unread</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-md h-fit">
          <CardHeader>
            <Button className="w-full" size="lg" onClick={() => setComposing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('all')}
            >
              <Inbox className="h-4 w-4 mr-2" />
              All Messages
              <Badge variant="secondary" className="ml-auto">{messages.length}</Badge>
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('unread')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Unread
              {unreadCount > 0 && <Badge variant="secondary" className="ml-auto">{unreadCount}</Badge>}
            </Button>
            <Button
              variant={filter === 'starred' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setFilter('starred')}
            >
              <Star className="h-4 w-4 mr-2" />
              Starred
              <Badge variant="secondary" className="ml-auto">{messages.filter(m => m.starred).length}</Badge>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {composing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <h3 className="text-lg font-semibold">New Message</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Input placeholder="Portfolio Manager, Operations Team, etc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Message subject" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea rows={10} placeholder="Type your message here..." />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" size="lg">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach
                  </Button>
                </div>
              </div>
            ) : selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Messages
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className={selectedMessage.starred ? 'fill-amber-400 text-amber-400' : ''} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h2>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{selectedMessage.from}</span>
                    <span className="text-muted-foreground">
                      {new Date(selectedMessage.date).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedMessage.body}</div>
                </ScrollArea>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2 text-sm">Attachments ({selectedMessage.attachments.length})</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{attachment}</span>
                          </div>
                          <Button size="sm" variant="outline">Download</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2 rotate-180" />
                  Reply
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        !message.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {!message.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className={`font-semibold ${!message.read ? 'text-primary' : ''}`}>
                            {message.from}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <h4 className={`font-semibold mb-1 ${!message.read ? 'text-primary' : ''}`}>
                        {message.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{message.preview}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {message.starred && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {message.attachments.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredMessages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
