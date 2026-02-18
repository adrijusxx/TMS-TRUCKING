import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { mkdir } from 'fs/promises';
import { inngest } from '@/lib/inngest/client';
import { LeadAutoScoringManager } from '@/lib/managers/LeadAutoScoringManager';

// GET /api/crm/leads/[id]/documents
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const companyId = session.user.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Verify lead access via companyId
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
                deletedAt: null
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const documents = await prisma.leadDocument.findMany({
            where: { leadId: id },
            orderBy: { uploadedAt: 'desc' },
            include: {
                uploadedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return NextResponse.json({ data: documents });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

// POST /api/crm/leads/[id]/documents
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const companyId = session.user.companyId;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Verify lead access via companyId
        const lead = await prisma.lead.findFirst({
            where: {
                id,
                companyId,
                deletedAt: null
            }
        });

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('documentType') as string || 'OTHER';
        const notes = formData.get('notes') as string || '';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size limit is 10MB' }, { status: 400 });
        }

        // Allowed types
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        // Save file
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${randomBytes(16).toString('hex')}.${fileExtension}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'crm-documents');
        const filePath = join(uploadDir, uniqueFilename);

        await mkdir(uploadDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const fileUrl = `/uploads/crm-documents/${uniqueFilename}`;

        // Create record
        const document = await prisma.leadDocument.create({
            data: {
                leadId: id,
                documentType,
                fileName: file.name,
                fileUrl,
                fileSize: file.size,
                mimeType: file.type,
                notes: notes,
                uploadedById: session.user.id
            },
            include: {
                uploadedBy: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                type: 'DOCUMENT_UPLOAD',
                content: `Uploaded document: ${file.name} (${documentType})`,
                userId: session.user.id
            }
        });

        // Trigger auto AI scoring for CDL/medical uploads
        const shouldScore = await LeadAutoScoringManager.shouldScoreOnDocumentUpload(id, documentType);
        if (shouldScore) {
            await inngest.send({ name: 'crm/auto-score-lead', data: { leadId: id } });
        }

        return NextResponse.json({ data: document });

    } catch (error: any) {
        console.error('Error uploading document:', error);
        return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
    }
}
