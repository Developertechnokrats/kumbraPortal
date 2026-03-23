'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { ThemeProvider } from '@/lib/theme/theme-context';
import { PortalSidebar } from '@/components/portal/sidebar';
import { PortalHeader } from '@/components/portal/header';
import { MarketTicker } from '@/components/portal/market-ticker';
import { Loader2 } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <PortalSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <PortalHeader />
          <MarketTicker />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
