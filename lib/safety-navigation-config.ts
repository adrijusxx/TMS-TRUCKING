import {
  LayoutDashboard,
  AlertTriangle,
  FileCheck,
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
  ShieldCheck,
  FileBarChart,
  FolderOpen,
  Building2,
  Award,
  AlertCircle,
  FileX,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';

// Standalone navigation items (always visible)
export const safetyStandaloneItems = [
  {
    name: 'Dashboard',
    href: '/dashboard/safety',
    icon: LayoutDashboard,
    description: 'Comprehensive safety dashboard providing real-time visibility into key safety metrics, active alerts, and compliance status.',
  },
];

// Navigation sections configuration
// Navigation sections configuration
export const safetyNavigationSections = [
  {
    title: 'Compliance',
    icon: FileCheck,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'Driver Compliance',
        href: '/dashboard/safety/compliance',
        icon: Users,
        description: 'Unified view of all driver documents, expirations, and qualifications.',
      },
    ],
  },
  {
    title: 'Fleet Safety',
    icon: Car,
    colorScheme: 'blue' as const,
    items: [
      {
        name: 'Inspections & Defects',
        href: '/dashboard/safety/fleet',
        icon: Wrench,
        description: 'Track DOT inspections, vehicle defects, and maintenance issues.',
      },
    ],
  },
  {
    title: 'Incidents',
    icon: AlertTriangle,
    colorScheme: 'red' as const,
    items: [
      {
        name: 'Accidents & Claims',
        href: '/dashboard/safety/incidents',
        icon: AlertCircle,
        description: 'Manage accidents, insurance claims, and safety incidents.',
      },
    ],
  },
  {
    title: 'Resources',
    icon: GraduationCap,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'Training & Docs',
        href: '/dashboard/safety/training',
        icon: FileText,
        description: 'Safety programs, training materials, and document library.',
      },
    ],
  },
];





