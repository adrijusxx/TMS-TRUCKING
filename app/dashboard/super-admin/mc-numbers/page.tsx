import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash, Search, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function McNumbersPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const searchParams = await searchParamsPromise;
    const search = searchParams.search || '';
    const page = parseInt(searchParams.page || '1');
    const pageSize = 50;

    const where = search
        ? {
            OR: [
                { number: { contains: search, mode: 'insensitive' as const } },
                { companyName: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : {};

    const [mcNumbers, totalCount] = await Promise.all([
        prisma.mcNumber.findMany({
            where,
            include: {
                company: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { users: true, loads: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.mcNumber.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">MC Number Management</h2>
                    <p className="text-slate-400">View and manage all Motor Carrier profiles</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                name="search"
                                placeholder="Search by MC number or company name..."
                                defaultValue={search}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>MC Profiles ({totalCount})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mcNumbers.map((mc) => (
                            <div key={mc.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-purple-400" />
                                        <span className="font-bold text-lg text-white">{mc.number}</span>
                                        {mc.isDefault && <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">DEFAULT</Badge>}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm text-slate-300 flex items-center gap-1">
                                            <Shield className="h-3 w-3" />
                                            {mc.companyName}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {mc._count.users} Users • {mc._count.loads} Loads
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Link href={`/dashboard/super-admin/companies/${mc.companyId}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
                            <div className="text-sm text-slate-400">Page {page} of {totalPages}</div>
                            <div className="flex gap-2">
                                {page > 1 && (
                                    <Link href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                                        <Button variant="outline" size="sm">Previous</Button>
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                                        <Button variant="outline" size="sm">Next</Button>
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
