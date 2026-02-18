import Link from 'next/link';
import { Truck, CalendarCheck, FileText, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TodayAtAGlanceProps {
  activeLoads: number;
  deliveriesToday: number;
  openInvoicesCount: number;
  openInvoicesBalance: number;
  availableDrivers: number;
  expiringDocsCount: number;
}

interface TileProps {
  href: string;
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  urgency?: 'ok' | 'warn' | 'alert';
}

function Tile({ href, icon: Icon, value, label, sub, urgency = 'ok' }: TileProps) {
  const colors = {
    ok: 'border-border hover:border-primary/50 hover:bg-primary/5',
    warn: 'border-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20',
    alert: 'border-red-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20',
  };
  const iconColors = {
    ok: 'text-primary',
    warn: 'text-amber-500',
    alert: 'text-red-500',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${colors[urgency]}`}
    >
      <div className={`rounded-md p-2 bg-muted ${iconColors[urgency]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
    </Link>
  );
}

export default function TodayAtAGlance({
  activeLoads,
  deliveriesToday,
  openInvoicesCount,
  openInvoicesBalance,
  availableDrivers,
  expiringDocsCount,
}: TodayAtAGlanceProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-xl font-semibold mb-0.5">Today at a Glance</h2>
        <p className="text-sm text-muted-foreground">Items that need your attention right now</p>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Tile
          href="/dashboard/loads?status=ACTIVE"
          icon={Truck}
          value={activeLoads}
          label="Active Loads"
          sub="In transit now"
          urgency="ok"
        />
        <Tile
          href="/dashboard/loads?dueToday=true"
          icon={CalendarCheck}
          value={deliveriesToday}
          label="Due Today"
          sub="Scheduled deliveries"
          urgency={deliveriesToday === 0 ? 'ok' : 'warn'}
        />
        <Tile
          href="/dashboard/invoices"
          icon={FileText}
          value={openInvoicesCount}
          label="Open Invoices"
          sub={openInvoicesBalance > 0 ? `${formatCurrency(openInvoicesBalance)} outstanding` : undefined}
          urgency={openInvoicesCount === 0 ? 'ok' : 'warn'}
        />
        <Tile
          href="/dashboard/drivers?status=AVAILABLE"
          icon={Users}
          value={availableDrivers}
          label="Available Drivers"
          sub="Ready for dispatch"
          urgency="ok"
        />
        <Tile
          href="/dashboard/safety/compliance"
          icon={AlertTriangle}
          value={expiringDocsCount}
          label="Expiring Docs"
          sub="Within 30 days"
          urgency={expiringDocsCount === 0 ? 'ok' : expiringDocsCount > 5 ? 'alert' : 'warn'}
        />
      </div>
    </section>
  );
}
