import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Hash, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function SuperAdminDashboard() {
    const session = await auth();

    // Fetch stats
    const [companiesCount, usersCount, mcNumbersCount] = await Promise.all([
        prisma.company.count(),
        prisma.user.count(),
        prisma.mcNumber.count(),
    ]);

    const stats = [
        {
            title: 'Total Companies',
            value: companiesCount,
            icon: Building2,
            href: '/dashboard/super-admin/companies',
            color: 'text-status-info',
            bgColor: 'bg-status-info-muted/20',
        },
        {
            title: 'Total Users',
            value: usersCount,
            icon: Users,
            href: '/dashboard/super-admin/users',
            color: 'text-status-success',
            bgColor: 'bg-status-success-muted/20',
        },
        {
            title: 'MC Numbers',
            value: mcNumbersCount,
            icon: Hash,
            href: '/dashboard/super-admin/mc-numbers',
            color: 'text-status-warning',
            bgColor: 'bg-status-warning-muted/20',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back, {session?.user?.firstName}</h2>
                <p className="text-muted-foreground">Manage all companies, users, and system settings from here.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:bg-accent/10 transition-colors cursor-pointer border-border/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link
                        href="/dashboard/super-admin/companies/new"
                        className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-status-info group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-medium text-foreground">Create Company</div>
                                <div className="text-sm text-muted-foreground">Add a new company to the system</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/users/new"
                        className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-status-success group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-medium text-foreground">Create User</div>
                                <div className="text-sm text-muted-foreground">Add a new user to any company</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/features"
                        className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-status-warning group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-medium text-foreground">Feature Gates</div>
                                <div className="text-sm text-muted-foreground">Manage module access per company</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/audit"
                        className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-status-error group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-medium text-foreground">Audit Logs</div>
                                <div className="text-sm text-muted-foreground">View system activity history</div>
                            </div>
                        </div>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
