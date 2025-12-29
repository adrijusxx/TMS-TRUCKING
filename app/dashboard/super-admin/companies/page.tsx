import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default async function CompaniesPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const searchParams = await searchParamsPromise;
    const search = searchParams.search || '';
    const page = parseInt(searchParams.page || '1');
    const pageSize = 20;

    // Fetch companies with pagination
    const where = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { dotNumber: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : {};

    const [companies, totalCount] = await Promise.all([
        prisma.company.findMany({
            where,
            include: {
                _count: {
                    select: {
                        mcNumbers: true,
                        users: true,
                    },
                },
                subscription: {
                    select: {
                        status: true,
                        planId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.company.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Company Management</h2>
                    <p className="text-slate-400">Manage all companies in the system</p>
                </div>
                <Link href="/dashboard/super-admin/companies/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Company
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                name="search"
                                placeholder="Search by name, DOT, or email..."
                                defaultValue={search}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Companies Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Companies ({totalCount})</CardTitle>
                    <CardDescription>All registered companies</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Company Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">DOT Number</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">MC Numbers</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Users</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Subscription</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr key={company.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium text-white">{company.name}</div>
                                                <div className="text-sm text-slate-400">{company.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">{company.dotNumber}</td>
                                        <td className="py-3 px-4 text-slate-300">{company._count.mcNumbers}</td>
                                        <td className="py-3 px-4 text-slate-300">{company._count.users}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${company.subscription?.status === 'ACTIVE'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : company.subscription?.status === 'FREE'
                                                        ? 'bg-slate-500/20 text-slate-300'
                                                        : 'bg-red-500/20 text-red-300'
                                                    }`}
                                            >
                                                {company.subscription?.status || 'NONE'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link href={`/dashboard/super-admin/companies/${company.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                            <div className="text-sm text-slate-400">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                {page > 1 && (
                                    <Link href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                                        <Button variant="outline" size="sm">
                                            Previous
                                        </Button>
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                                        <Button variant="outline" size="sm">
                                            Next
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
