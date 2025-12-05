'use client';

/**
 * Driver Mobile PWA Layout
 * 
 * Enhanced layout with PWA features for offline support.
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD Section 6
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Truck, DollarSign, LifeBuoy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { OfflineIndicator } from '@/components/driver/OfflineIndicator';
import { PWAInstallBanner } from '@/components/driver/PWAInstallBanner';

export default function DriverMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const navItems = [
    {
      href: '/driver',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/driver/loads',
      icon: Truck,
      label: 'Loads',
    },
    {
      href: '/driver/settlements',
      icon: DollarSign,
      label: 'Pay',
    },
    {
      href: '/driver/support',
      icon: LifeBuoy,
      label: 'Support',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">
              {session?.user?.firstName} {session?.user?.lastName}
            </h1>
            <p className="text-xs text-muted-foreground">Driver Portal</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-sm"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/driver' && pathname?.startsWith(item.href + '/'));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
