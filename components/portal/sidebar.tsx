'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { KumbraLogo } from '@/components/ui/kumbra-logo';

const navigation = [
  { name: 'Portfolio Overview', href: '/portal', icon: LayoutDashboard },
  { name: 'Current Holdings', href: '/portal/holdings', icon: Briefcase },
  { name: 'Payment Calendar', href: '/portal/calendar', icon: Calendar },
  { name: 'Cash Management', href: '/portal/transactions', icon: Receipt },
  { name: 'Documents', href: '/portal/documents', icon: FileText },
  { name: 'Secure Mail', href: '/portal/messages', icon: MessageSquare },
  { name: 'Investments', href: '/portal/investments', icon: TrendingUp },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border/50 bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border/30 px-5">
        <KumbraLogo width={160} height={46} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-primary/10 hover:text-sidebar-foreground dark:hover:bg-white/10'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
