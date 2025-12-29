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
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Total Users',
            value: usersCount,
            icon: Users,
            href: '/dashboard/super-admin/users',
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'MC Numbers',
            value: mcNumbersCount,
            icon: Hash,
            href: '/dashboard/super-admin/mc-numbers',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {session?.user?.firstName}</h2>
                <p className="text-slate-400">Manage all companies, users, and system settings from here.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
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
                        className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-400" />
                            <div>
                                <div className="font-medium text-white">Create Company</div>
                                <div className="text-sm text-slate-400">Add a new company to the system</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/users/new"
                        className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-green-400" />
                            <div>
                                <div className="font-medium text-white">Create User</div>
                                <div className="text-sm text-slate-400">Add a new user to any company</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/features"
                        className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-purple-400" />
                            <div>
                                <div className="font-medium text-white">Feature Gates</div>
                                <div className="text-sm text-slate-400">Manage module access per company</div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/super-admin/audit"
                        className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-orange-400" />
                            <div>
                                <div className="font-medium text-white">Audit Logs</div>
                                <div className="text-sm text-slate-400">View system activity history</div>
                            </div>
                        </div>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
