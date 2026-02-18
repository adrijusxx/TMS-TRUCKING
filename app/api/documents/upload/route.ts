import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DocumentType } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * POST /api/documents/upload
 * Upload a document (work order, receipt, invoice, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const breakdownId = formData.get('breakdownId') as string;
    const loadId = formData.get('loadId') as string;
    const driverId = formData.get('driverId') as string;
    const truckId = formData.get('truckId') as string;
    const title = formData.get('title') as string;
    const documentTypeRaw = formData.get('type') as string || 'OTHER';
    // Validate and cast to DocumentType enum
    const documentType = Object.values(DocumentType).includes(documentTypeRaw as DocumentType)
      ? (documentTypeRaw as DocumentType)
      : DocumentType.OTHER;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'File size must be less than 10MB' } },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid file type. Only PNG, JPEG, and PDF are allowed' } },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${randomBytes(16).toString('hex')}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents');
    const filePath = join(uploadDir, uniqueFilename);

    // Ensure upload directory exists
    const { mkdir } = await import('fs/promises');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/documents/${uniqueFilename}`;

    // Optional: extract structured data using OCR + AI
    const shouldExtract = formData.get('extract') === 'true';
    let extractedData = null;

    if (shouldExtract) {
      try {
        const { AIDocumentProcessor } = await import('@/lib/services/AIDocumentProcessor');
        const processor = new AIDocumentProcessor();
        // Map DocumentType enum to processor input types
        const processorTypeMap: Record<string, string> = {
          INVOICE: 'INVOICE', RECEIPT: 'RECEIPT', POD: 'POD', BOL: 'BOL',
          INSURANCE: 'INSURANCE', DRIVER_LICENSE: 'SAFETY_DOCUMENT',
          MEDICAL_CARD: 'SAFETY_DOCUMENT', INSPECTION: 'MAINTENANCE_RECORD',
        };
        const processorType = (processorTypeMap[documentType] || 'OTHER') as any;
        extractedData = await processor.processDocumentFromFile(buffer, file.type, processorType, file.name);
      } catch (extractError) {
        console.warn('[Upload] Auto-extraction failed (non-blocking):', extractError);
      }
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        title: title || file.name,
        fileName: uniqueFilename,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        type: documentType,
        breakdownId: breakdownId || undefined,
        loadId: loadId || undefined,
        driverId: driverId || undefined,
        truckId: truckId || undefined,
        companyId: session.user.companyId,
        uploadedBy: session.user.id,
        ...(extractedData ? { metadata: extractedData as any } : {}),
      },
    });

    return NextResponse.json(
      { success: true, data: document, ...(extractedData ? { extractedData } : {}) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to upload document',
        },
      },
      { status: 500 }
    );
  }
}
