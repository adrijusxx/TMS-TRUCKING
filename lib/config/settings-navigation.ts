import {
  Settings,
  Users,
  Shield,
  CreditCard,
  Plug,
  FileText,
  Hash,
  ShoppingBag,
  Palette,
  Tag,
  FolderTree,
  Layers,
  Building2,
  Bell,
  User,
  Activity,
  Database,
  RotateCcw,
  History,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  query?: string;
  adminOnly?: boolean;
  category?: string;
}

export interface NavCategory {
  name: string;
  items: NavItem[];
  adminOnly?: boolean;
}

/**
 * Get navigation categories for settings
 * @param baseSettingsPath - Base path for settings (admin or employee)
 * @returns Array of navigation categories
 */
export function getSettingsNavigationCategories(baseSettingsPath: string): NavCategory[] {
  return [
    {
      name: 'My Profile',
      adminOnly: false,
      items: [
        {
          name: 'My Profile',
          href: baseSettingsPath,
          icon: User,
          query: 'tab=profile',
          category: 'My Profile',
          adminOnly: false
        },
      ],
    },
    {
      name: 'Main Settings',
      adminOnly: false,
      items: [
        {
          name: 'Company & Organization',
          href: baseSettingsPath,
          icon: Building2,
          query: 'tab=company',
          category: 'Main Settings',
          adminOnly: true
        },
        {
          name: 'Team & Users',
          href: baseSettingsPath,
          icon: Users,
          query: 'tab=team',
          category: 'Main Settings',
          adminOnly: true
        },
        {
          name: 'System Configuration',
          href: baseSettingsPath,
          icon: Settings,
          query: 'tab=system',
          category: 'Main Settings',
          adminOnly: true
        },
      ],
    },
    {
      name: 'Customizations',
      adminOnly: true,
      items: [
        {
          name: 'Customizations',
          href: baseSettingsPath,
          icon: Layers,
          query: 'tab=customizations',
          category: 'Customizations',
          adminOnly: true
        },
      ],
    },
    {
      name: 'Security & Preferences',
      adminOnly: false,
      items: [
        {
          name: 'Notifications',
          href: baseSettingsPath,
          icon: Bell,
          query: 'tab=notifications',
          category: 'Security & Preferences',
          adminOnly: false
        },
        {
          name: 'Security & Privacy',
          href: baseSettingsPath,
          icon: Shield,
          query: 'tab=security',
          category: 'Security & Preferences',
          adminOnly: true
        },
      ],
    },
    {
      name: 'Integrations & Billing',
      adminOnly: true,
      items: [
        {
          name: 'Integrations',
          href: baseSettingsPath,
          icon: Plug,
          query: 'tab=integrations',
          category: 'Integrations & Billing',
          adminOnly: true
        },
        {
          name: 'Billing & Subscription',
          href: baseSettingsPath,
          icon: CreditCard,
          query: 'tab=billing',
          category: 'Integrations & Billing',
          adminOnly: true
        },
      ],
    },
    {
      name: 'Data Management',
      adminOnly: true,
      items: [
        {
          name: 'Bulk Delete',
          href: baseSettingsPath,
          icon: Database,
          query: 'tab=data-management',
          category: 'Data Management',
          adminOnly: true
        },
        {
          name: 'Deleted Items',
          href: baseSettingsPath,
          icon: RotateCcw,
          query: 'tab=deleted-items',
          category: 'Data Management',
          adminOnly: true
        },
        {
          name: 'Audit History',
          href: baseSettingsPath,
          icon: History,
          query: 'tab=audit-history',
          category: 'Data Management',
          adminOnly: true
        },
        {
          name: 'Data Reconciliation',
          href: '/dashboard/import-export/reconcile',
          icon: Database, // Re-using Database icon or similar
          category: 'Data Management',
          adminOnly: true
        },
      ],
    },
    {
      name: 'Other',
      adminOnly: false,
      items: [
        {
          name: 'EDI',
          href: '/dashboard/edi',
          icon: FileText,
          category: 'Other'
        },
        {
          name: 'MC Numbers',
          href: '/dashboard/mc-numbers',
          icon: Hash,
          category: 'Other'
        },
        {
          name: 'Apps & Marketplace',
          href: '/dashboard/apps/marketplace',
          icon: ShoppingBag,
          category: 'Other'
        },
        {
          name: 'System Monitoring',
          href: '/dashboard/admin/monitoring',
          icon: Activity,
          category: 'Other',
          adminOnly: true
        },
      ],
    },
  ];
}

