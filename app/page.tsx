'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, UserCircle, Shield } from 'lucide-react';
import { KumbraLogo } from '@/components/ui/kumbra-logo';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/portal');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mx-auto mb-8 flex items-center justify-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm shadow-2xl">
          <KumbraLogo width={300} height={120} />
        </div>

        <p className="mb-12 text-xl text-slate-300">Investment Management Portal</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/auth/signin')}
            className="group relative overflow-hidden rounded-xl bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary transition-colors">
                <UserCircle className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Client Portal</h2>
              <p className="text-slate-600">Access your investment portfolio</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/signin')}
            className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 p-8 shadow-xl transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105"
          >
            <div className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
              <p className="text-slate-300">Advisor & administrative access</p>
            </div>
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-400">Secure access to professional investment management</p>
      </div>
    </div>
  );
}
