'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Mail,
  Shield,
  BarChart3,
  Settings,
  CheckSquare,
  Clock,
  Upload,
  Wrench,
  Wallet,
  Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Holdings', href: '/admin/holdings', icon: TrendingUp },
  { name: 'Cash Management', href: '/admin/cash', icon: Wallet, badge: 'pending' },
  { name: 'Deposits', href: '/admin/deposits', icon: DollarSign, badge: 'pending' },
  { name: 'Client Requests', href: '/admin/requests', icon: Phone, badge: 'requests' },
  { name: 'Product Settings', href: '/admin/prices', icon: Wrench },
  { name: 'KYC Approvals', href: '/admin/kyc', icon: CheckSquare, badge: 'kyc' },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Messages', href: '/admin/messages', icon: Mail, badge: 'messages' },
  { name: 'Business Stats', href: '/admin/stats', icon: BarChart3 },
  { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
];

interface AdminNavProps {
  pendingDeposits?: number;
  pendingKYC?: number;
  unreadMessages?: number;
  pendingRequests?: number;
}

export function AdminNav({ pendingDeposits = 0, pendingKYC = 0, unreadMessages = 0, pendingRequests = 0 }: AdminNavProps) {
  const pathname = usePathname();

  const getBadgeCount = (badgeType: string | undefined) => {
    if (badgeType === 'pending') return pendingDeposits;
    if (badgeType === 'kyc') return pendingKYC;
    if (badgeType === 'messages') return unreadMessages;
    if (badgeType === 'requests') return pendingRequests;
    return 0;
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Admin Portal</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const badgeCount = getBadgeCount(item.badge);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
              {badgeCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/portal"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          Back to Portal
        </Link>
      </div>
    </aside>
  );
}
