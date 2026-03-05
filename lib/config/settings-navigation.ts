import {
  Settings,
  Users,
  Shield,
  CreditCard,
  Plug,
  Building2,
  Bell,
  User,
  Database,
  Timer,
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
        {
          name: 'Scheduled Jobs',
          href: baseSettingsPath,
          icon: Timer,
          query: 'tab=scheduled-jobs',
          category: 'Main Settings',
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
          name: 'Data & Audit',
          href: baseSettingsPath,
          icon: Database,
          query: 'tab=data-management',
          category: 'Data Management',
          adminOnly: true
        },
      ],
    },
  ];
}

