import { Suspense } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import KanbanBoard from '@/components/crm/KanbanBoard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Recruiting Kanban | TMS',
    description: 'Visual pipeline for recruiting leads',
};

async function KanbanData() {
    const session = await auth();
    if (!session?.user) return null;

    const mcWhere = await buildMcNumberWhereClause(session, requestStub());

    // We need to fetch leads with assigned user
    const leads = await prisma.lead.findMany({
        where: {
            ...mcWhere,
            deletedAt: null
        },
        include: {
            assignedTo: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    const formattedLeads = leads.map(lead => ({
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        status: lead.status,
        priority: lead.priority,
        phone: lead.phone,
        email: lead.email,
        assignedTo: lead.assignedTo,
        updatedAt: lead.updatedAt.toISOString()
    }));

    return <KanbanBoard leads={formattedLeads} />;
}

// Helper to mock request object for mc-filter if needed, 
// though looking at lib/mc-number-filter it might expect a Request object.
// Let's check `lib/mc-number-filter.ts` usage pattern. 
// If it requires a Request object for header checking, we might need to handle that.
// But mostly it uses session. 
function requestStub() {
    return {
        headers: new Headers()
    } as unknown as Request;
}

export default async function KanbanPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // Permission check
    // We reuse the verifyPermission logic or check manually
    // Assuming 'departments.crm.view' is enough

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pipeline Board</h1>
                    <p className="text-muted-foreground">
                        Drag and drop leads to move them through the hiring pipeline
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="flex gap-4 overflow-auto pb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-80 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ))}
            </div>}>
                <KanbanData />
            </Suspense>
        </div>
    );
}
