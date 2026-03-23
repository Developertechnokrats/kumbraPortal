'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Phone, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, addDays, setHours, setMinutes } from 'date-fns';

interface RequestCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TOPICS = [
  { value: 'portfolio_review', label: 'Portfolio Review' },
  { value: 'new_investment', label: 'New Investment Opportunity' },
  { value: 'withdrawal', label: 'Withdrawal Inquiry' },
  { value: 'account_changes', label: 'Account Changes' },
  { value: 'tax_documents', label: 'Tax Documents' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'other', label: 'Other' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

export function RequestCallDialog({
  open,
  onOpenChange,
  onSuccess,
}: RequestCallDialogProps) {
  const { client } = useAuth();
  const [topic, setTopic] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const getPreferredDateTime = () => {
    if (!preferredDate || !preferredTime) return null;
    const [hours, minutes] = preferredTime.split(':').map(Number);
    const date = new Date(preferredDate);
    return setMinutes(setHours(date, hours), minutes);
  };

  const handleSubmit = async () => {
    if (!client) return;
    if (!topic) {
      setError('Please select a topic');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const preferredDateTime = getPreferredDateTime();
      const topicLabel = TOPICS.find(t => t.value === topic)?.label || topic;

      const { error: insertError } = await (supabase as any)
        .from('client_requests')
        .insert({
          client_id: client.id,
          request_type: 'CALL_REQUEST',
          status: 'PENDING',
          subject: `Call Request: ${topicLabel}`,
          details: details || null,
          preferred_datetime: preferredDateTime?.toISOString() || null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSuccess(false);
        setTopic('');
        setPreferredDate('');
        setPreferredTime('');
        setDetails('');
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting call request:', err);
      setError(err.message || 'Failed to submit call request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      setSuccess(false);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Request a Call from Your Advisor
          </DialogTitle>
          <DialogDescription>
            Schedule a time for your advisor to call you
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Call Request Submitted</h3>
            <p className="text-muted-foreground">
              Your advisor will contact you at your preferred time. You'll receive a confirmation shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What would you like to discuss?</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Preferred Date
                </Label>
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Time (UK)</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Any specific questions or topics you'd like to discuss..."
                rows={4}
              />
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                If you don't specify a time, your advisor will call you during business hours (9am-5pm UK time).
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !topic}>
              {submitting ? 'Submitting...' : 'Request Call'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
