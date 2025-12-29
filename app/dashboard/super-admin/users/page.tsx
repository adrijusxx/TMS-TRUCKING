import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default async function UsersPage({
    searchParams: searchParamsPromise,
}: {
    searchParams: Promise<{ search?: string; page?: string; role?: string; companyId?: string }>;
}) {
    const searchParams = await searchParamsPromise;
    const search = searchParams.search || '';
    const role = searchParams.role || '';
    const page = parseInt(searchParams.page || '1');
    const pageSize = 20;

    // Build where clause
    const where: any = {};

    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
        ];
    }

    if (role) {
        where.role = role;
    }

    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                company: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">User Management</h2>
                    <p className="text-slate-400">Manage all users across all companies</p>
                </div>
                <Link href="/dashboard/super-admin/users/new">
                    <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create User
                    </Button>
                </Link>
            </div>

            {/* Search & Filters */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                name="search"
                                placeholder="Search by name or email..."
                                defaultValue={search}
                                className="pl-10"
                            />
                        </div>
                        <select
                            name="role"
                            defaultValue={role}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white"
                        >
                            <option value="">All Roles</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="DISPATCHER">Dispatcher</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="DRIVER">Driver</option>
                        </select>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users ({totalCount})</CardTitle>
                    <CardDescription>All registered users</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Email</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Role</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Company</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-white">
                                                {user.firstName} {user.lastName}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">{user.email}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'SUPER_ADMIN'
                                                    ? 'bg-red-500/20 text-red-300'
                                                    : user.role === 'ADMIN'
                                                        ? 'bg-blue-500/20 text-blue-300'
                                                        : 'bg-slate-500/20 text-slate-300'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">{user.company?.name || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <Link href={`/dashboard/super-admin/users/${user.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    Edit
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
                                    <Link href={`?page=${page - 1}${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}`}>
                                        <Button variant="outline" size="sm">
                                            Previous
                                        </Button>
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link href={`?page=${page + 1}${search ? `&search=${search}` : ''}${role ? `&role=${role}` : ''}`}>
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
