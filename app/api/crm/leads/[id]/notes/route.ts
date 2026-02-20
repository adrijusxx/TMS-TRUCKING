import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';

// GET /api/crm/leads/[id]/notes
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const mcWhere = await buildMcNumberWhereClause(session, request);

        // Verify lead access
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                ...mcWhere
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const rawNotes = await prisma.leadNote.findMany({
            where: { leadId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Map createdBy → user so the LeadNotes component can access note.user
        const notes = rawNotes.map(n => ({
            ...n,
            user: n.createdBy,
        }));

        return NextResponse.json({ data: notes });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

// POST /api/crm/leads/[id]/notes
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const lead = await prisma.lead.findFirst({
            where: { id, ...mcWhere }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const note = await prisma.leadNote.create({
            data: {
                leadId: id,
                content,
                createdById: session.user.id
            },
            include: {
                createdBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                type: 'NOTE',
                content: `Added note: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                userId: session.user.id
            }
        });

        return NextResponse.json({ data: note });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}

// PATCH /api/crm/leads/[id]/notes — Update a note (creator only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { noteId, content } = body;

        if (!noteId || !content) {
            return NextResponse.json({ error: 'noteId and content are required' }, { status: 400 });
        }

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const lead = await prisma.lead.findFirst({ where: { id, ...mcWhere } });
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        // Verify note exists and belongs to the current user
        const note = await prisma.leadNote.findFirst({ where: { id: noteId, leadId: id } });
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        if (note.createdById !== session.user.id) {
            return NextResponse.json({ error: 'Only the note creator can edit' }, { status: 403 });
        }

        const updated = await prisma.leadNote.update({
            where: { id: noteId },
            data: { content },
            include: { createdBy: { select: { firstName: true, lastName: true } } },
        });

        return NextResponse.json({ data: { ...updated, user: updated.createdBy } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}

// DELETE /api/crm/leads/[id]/notes — Delete a note (creator or admin)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get('noteId');

        if (!noteId) return NextResponse.json({ error: 'noteId is required' }, { status: 400 });

        const mcWhere = await buildMcNumberWhereClause(session, request);
        const lead = await prisma.lead.findFirst({ where: { id, ...mcWhere } });
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const note = await prisma.leadNote.findFirst({ where: { id: noteId, leadId: id } });
        if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

        const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';
        if (note.createdById !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized to delete this note' }, { status: 403 });
        }

        await prisma.leadNote.delete({ where: { id: noteId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}
