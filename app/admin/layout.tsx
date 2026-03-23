'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AdminNav } from '@/components/admin/admin-nav';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, profile } = useAuth();
  const [counts, setCounts] = useState({ deposits: 0, kyc: 0, messages: 0, requests: 0 });

  const isSignInPage = pathname === '/admin/signin';

  useEffect(() => {
    if (!loading && !isSignInPage) {
      if (!user) {
        router.push('/admin/signin');
      } else if (profile && profile.role === 'CLIENT') {
        router.push('/portal');
      }
    }
  }, [user, loading, profile, router, isSignInPage]);

  useEffect(() => {
    if (profile?.role === 'ADMIN') {
      loadCounts();
      const interval = setInterval(loadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const loadCounts = async () => {
    const [depositsRes, kycRes, messagesRes, requestsRes] = await Promise.all([
      (supabase as any).from('deposit_notifications').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('kyc_status', 'PENDING'),
      (supabase as any).from('message_threads').select('id', { count: 'exact', head: true }),
      (supabase as any).from('client_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING')
    ]);

    setCounts({
      deposits: depositsRes.count || 0,
      kyc: kycRes.count || 0,
      messages: messagesRes.count || 0,
      requests: requestsRes.count || 0
    });
  };

  if (isSignInPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (profile && profile.role === 'CLIENT')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminNav
        pendingDeposits={counts.deposits}
        pendingKYC={counts.kyc}
        unreadMessages={counts.messages}
        pendingRequests={counts.requests}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
