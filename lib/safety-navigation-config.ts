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
export const safetyNavigationSections = [
  {
    title: 'Vehicle Safety',
    icon: Car,
    colorScheme: 'green' as const,
    items: [
      {
        name: 'Work Orders',
        href: '/dashboard/safety/work-orders',
        icon: Wrench,
        description: 'Manage safety-related work orders and maintenance requests.',
      },
      {
        name: 'Incidents',
        href: '/dashboard/safety/incidents',
        icon: AlertTriangle,
        description: 'Record and track all safety incidents including accidents, collisions, and more.',
      },
      {
        name: 'Alerts',
        href: '/dashboard/safety/alerts',
        icon: Bell,
        description: 'View and manage active safety alerts and notifications in real-time.',
      },
      {
        name: 'DVIR',
        href: '/dashboard/safety/dvir',
        icon: ClipboardList,
        description: 'Create and manage Driver Vehicle Inspection Reports (DVIR).',
      },
      {
        name: 'Defects',
        href: '/dashboard/safety/defects',
        icon: Wrench,
        description: 'Track and manage vehicle defects identified during inspections.',
      },
      {
        name: 'Roadside Inspections',
        href: '/dashboard/safety/roadside-inspections',
        icon: Car,
        description: 'Record and track all roadside inspection results conducted by DOT officers.',
      },
      {
        name: 'DOT Inspections',
        href: '/dashboard/safety/dot-inspections',
        icon: ShieldCheck,
        description: 'Manage comprehensive DOT inspection records.',
      },
      {
        name: 'Out of Service Orders',
        href: '/dashboard/safety/out-of-service',
        icon: AlertCircle,
        description: 'Track vehicles and drivers placed out of service.',
      },
    ],
  },
  {
    title: 'Compliance & Reporting',
    icon: BarChart3,
    colorScheme: 'purple' as const,
    items: [
      {
        name: 'Documents',
        href: '/dashboard/safety/documents',
        icon: FolderOpen,
        description: 'Centralized document management system for all safety-related records.',
      },
      {
        name: 'Driver Compliance',
        href: '/dashboard/safety/driver-compliance',
        icon: FileCheck,
        description: 'Unified driver compliance management - DQF, Medical Cards, CDL, MVR, Drug Tests, HOS, and Annual Reviews all in one place.',
      },
      {
        name: 'Training Records',
        href: '/dashboard/safety/trainings',
        icon: GraduationCap,
        description: 'Manage comprehensive driver training records and certifications.',
      },
      {
        name: 'CSA Scores',
        href: '/dashboard/safety/compliance/csa-scores',
        icon: BarChart3,
        description: 'View and analyze CSA scores from FMCSA.',
      },
      {
        name: 'DataQ',
        href: '/dashboard/safety/compliance/dataq',
        icon: CheckCircle2,
        description: 'Submit DataQ challenges to FMCSA to dispute incorrect violations.',
      },
      {
        name: 'FMCSA Compliance',
        href: '/dashboard/safety/compliance/fmcsa',
        icon: Shield,
        description: 'Monitor FMCSA compliance requirements and track all compliance action items.',
      },
      {
        name: 'Reports',
        href: '/dashboard/safety/reports',
        icon: FileBarChart,
        description: 'Generate comprehensive safety reports and analytics.',
      },
    ],
  },
  {
    title: 'Insurance',
    icon: Building2,
    colorScheme: 'yellow' as const,
    items: [
      {
        name: 'Insurance Policies',
        href: '/dashboard/safety/insurance/policies',
        icon: Building2,
        description: 'Manage all insurance policies and coverage for your fleet.',
      },
      {
        name: 'Claims',
        href: '/dashboard/safety/insurance/claims',
        icon: FileX,
        description: 'Track all insurance claims and settlements for incidents and accidents.',
      },
    ],
  },
  {
    title: 'Safety Programs',
    icon: Shield,
    colorScheme: 'teal' as const,
    items: [
      {
        name: 'Safety Meetings',
        href: '/dashboard/safety/programs/meetings',
        icon: Users,
        description: 'Schedule and track all safety meetings and training sessions.',
      },
      {
        name: 'Safety Policies',
        href: '/dashboard/safety/programs/policies',
        icon: FileText,
        description: 'Manage all safety policies and procedures for your organization.',
      },
      {
        name: 'Recognition Programs',
        href: '/dashboard/safety/programs/recognition',
        icon: Award,
        description: 'Track driver recognition and safety awards to promote safe driving behavior.',
      },
    ],
  },
];





