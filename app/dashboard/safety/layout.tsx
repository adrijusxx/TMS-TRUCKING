'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  AlertTriangle,
  FileCheck,
  Shield,
  Truck,
  Users,
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Wrench,
  CheckCircle2,
  Car,
  Clock,
  TestTube,
  GraduationCap,
  Calendar,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  ShieldCheck,
  FileBarChart,
  FolderOpen,
  ClipboardCheck,
  Building2,
  Award,
  AlertCircle,
  FileX
} from 'lucide-react';

const safetyNavItems = [
  // Dashboard
  { name: 'Dashboard', href: '/dashboard/safety', icon: LayoutDashboard },
  
  // Incidents & Accidents
  { name: 'Incidents', href: '/dashboard/safety/incidents', icon: AlertTriangle },
  { name: 'Alerts', href: '/dashboard/safety/alerts', icon: Bell },
  
  // Driver Compliance
  { name: 'DQF Management', href: '/dashboard/safety/dqf', icon: FileCheck },
  { name: 'Medical Cards', href: '/dashboard/safety/medical-cards', icon: FileText },
  { name: 'CDL Records', href: '/dashboard/safety/cdl', icon: FileCheck },
  { name: 'MVR Tracking', href: '/dashboard/safety/mvr', icon: Search },
  { name: 'Drug Tests', href: '/dashboard/safety/drug-tests', icon: TestTube },
  { name: 'HOS Monitoring', href: '/dashboard/safety/hos', icon: Clock },
  { name: 'Annual Reviews', href: '/dashboard/safety/annual-reviews', icon: Calendar },
  { name: 'Training Records', href: '/dashboard/safety/trainings', icon: GraduationCap },
  
  // Vehicle Safety
  { name: 'DVIR', href: '/dashboard/safety/dvir', icon: ClipboardList },
  { name: 'Defects', href: '/dashboard/safety/defects', icon: Wrench },
  { name: 'Roadside Inspections', href: '/dashboard/safety/roadside-inspections', icon: Car },
  { name: 'DOT Inspections', href: '/dashboard/safety/dot-inspections', icon: ShieldCheck },
  { name: 'Out of Service Orders', href: '/dashboard/safety/out-of-service', icon: AlertCircle },
  
  // DOT Compliance
  { name: 'CSA Scores', href: '/dashboard/safety/compliance/csa-scores', icon: BarChart3 },
  { name: 'DataQ', href: '/dashboard/safety/compliance/dataq', icon: CheckCircle2 },
  { name: 'FMCSA Compliance', href: '/dashboard/safety/compliance/fmcsa', icon: Shield },
  
  // Insurance & Claims
  { name: 'Insurance Policies', href: '/dashboard/safety/insurance/policies', icon: Building2 },
  { name: 'Claims', href: '/dashboard/safety/insurance/claims', icon: FileX },
  
  // Safety Programs
  { name: 'Safety Meetings', href: '/dashboard/safety/programs/meetings', icon: Users },
  { name: 'Safety Policies', href: '/dashboard/safety/programs/policies', icon: FileText },
  { name: 'Recognition Programs', href: '/dashboard/safety/programs/recognition', icon: Award },
  
  // Document Management
  { name: 'Documents', href: '/dashboard/safety/documents', icon: FolderOpen },
  
  // Reports & Analytics
  { name: 'Reports', href: '/dashboard/safety/reports', icon: FileBarChart },
];

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('safetySidebarOpen');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar preference to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('safetySidebarOpen', String(newState));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] relative">
      {/* Safety Sidebar - Always visible unless toggled closed */}
      {sidebarOpen && (
        <aside className="w-64 border-r bg-slate-50 dark:bg-secondary p-4 space-y-2 overflow-y-auto transition-all">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Safety Department
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleSidebar}
              title="Hide sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <nav className="space-y-1">
            {safetyNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background relative">
        {!sidebarOpen && (
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              title="Show sidebar"
              className="h-9 px-4 gap-2 shadow-sm border bg-background hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm">Show Menu</span>
            </Button>
          </div>
        )}
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
