'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Shield, FileText, Wrench, AlertTriangle } from 'lucide-react';

const tabs = [
  { name: 'Safety', href: '/dashboard/safety', icon: Shield },
  { name: 'Documents', href: '/dashboard/safety/documents', icon: FileText },
  { name: 'Work Orders', href: '/dashboard/safety/work-orders', icon: Wrench },
];

export default function SafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (tab.href !== '/dashboard/safety' && pathname?.startsWith(tab.href));
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}

