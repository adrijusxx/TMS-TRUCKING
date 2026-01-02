
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CleanupClient from './CleanupClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Cleanup | TMS Super Admin',
    description: 'Hard delete data for cleanup purposes',
};

export default async function DataCleanupPage() {
    const session = await auth();

    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/dashboard');
    }

    // Fetch all companies for the selector
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            dotNumber: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return (
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h1 className="text-2xl font-bold text-red-800 flex items-center gap-2">
                    <span className="text-3xl">⚠️</span> DANGER ZONE: Hard Data Deletion
                </h1>
                <p className="text-red-700 mt-2">
                    This tool allows for the <strong>permanent deletion</strong> of records.
                    Deleted data cannot be recovered. Foreign key constraints will be handled automatically,
                    but exercise extreme caution.
                </p>
            </div>

            <CleanupClient companies={companies} />
        </div>
    );
}
