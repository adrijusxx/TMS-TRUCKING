import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Building2 } from 'lucide-react';
import Link from 'next/link';

export default async function FeatureGatesPage() {
    // Fetch all companies with their subscriptions
    const companies = await prisma.company.findMany({
        include: {
            subscription: {
                include: {
                    addOns: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    const allModules = ['FLEET', 'ACCOUNTING', 'SAFETY', 'HR', 'INTEGRATIONS', 'AI_DISPATCH', 'ANALYTICS'];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Feature Gate Control</h2>
                <p className="text-slate-400">Manage module access for each company</p>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {companies.map((company) => {
                    const subscription = company.subscription;
                    const enabledModules = subscription?.manualOverride
                        ? subscription.manualModules
                        : subscription?.addOns.filter((a) => a.isActive).map((a) => a.module) || [];

                    return (
                        <Card key={company.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="h-5 w-5 text-blue-400" />
                                        <div>
                                            <CardTitle className="text-lg">{company.name}</CardTitle>
                                            <CardDescription className="text-xs">{company.dotNumber}</CardDescription>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/super-admin/features/${company.id}`}>
                                        <Button variant="outline" size="sm">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Subscription:</span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${subscription?.status === 'ACTIVE'
                                                ? 'bg-green-500/20 text-green-300'
                                                : subscription?.status === 'FREE'
                                                    ? 'bg-slate-500/20 text-slate-300'
                                                    : 'bg-red-500/20 text-red-300'
                                                }`}
                                        >
                                            {subscription?.status || 'NONE'}
                                        </span>
                                    </div>

                                    {subscription?.manualOverride && (
                                        <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                                            <Activity className="h-3 w-3" />
                                            Manual Override Active
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-700">
                                        <div className="text-xs text-slate-400 mb-2">Enabled Modules:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {enabledModules.length > 0 ? (
                                                enabledModules.map((module) => (
                                                    <span
                                                        key={module}
                                                        className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs"
                                                    >
                                                        {module}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-500">None</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
