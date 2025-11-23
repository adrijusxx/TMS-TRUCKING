import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DocumentService } from '@/lib/services/safety/DocumentService';
import { validateFileUpload, sanitizeFileName, getFileSizeLimit } from '@/lib/utils/file-upload-validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentService = new DocumentService(prisma, session.user.companyId);

    const result = await documentService.searchDocuments({
      companyId: session.user.companyId,
      searchTerm: searchParams.get('search') || undefined,
      documentType: searchParams.get('type') || undefined,
      relatedEntityType: searchParams.get('entityType') || undefined,
      relatedEntityId: searchParams.get('entityId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check content type to handle both JSON and FormData
    const contentType = request.headers.get('content-type') || '';
    
    let body: any;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const documentType = formData.get('documentType') as string | null;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided in FormData' },
          { status: 400 }
        );
      }

      // Validate file upload
      const maxSize = getFileSizeLimit(file.type);
      const validation = validateFileUpload(file, {
        maxSize,
        requireExtension: true,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'File validation failed' },
          { status: 400 }
        );
      }

      // Sanitize filename
      const sanitizedFileName = sanitizeFileName(file.name);

      // File storage implementation:
      // Option 1: AWS S3 - Use @aws-sdk/client-s3
      // Option 2: Cloudinary - Use cloudinary npm package
      // Option 3: Google Cloud Storage - Use @google-cloud/storage
      // For now, create a temporary URL structure (replace with actual storage in production)
      // Example S3 implementation:
      // const s3Client = new S3Client({ region: process.env.AWS_REGION });
      // const uploadResult = await s3Client.send(new PutObjectCommand({
      //   Bucket: process.env.AWS_S3_BUCKET,
      //   Key: `${session.user.companyId}/${Date.now()}-${sanitizedFileName}`,
      //   Body: await file.arrayBuffer(),
      //   ContentType: file.type
      // }));
      // const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadResult.Key}`;
      const fileUrl = `/uploads/${session.user.companyId}/${Date.now()}-${sanitizedFileName}`;
      
      body = {
        fileName: sanitizedFileName,
        fileUrl: fileUrl, // This should be replaced with actual storage URL
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        type: documentType || 'OTHER',
        title: sanitizedFileName,
        description: `Uploaded via DQF form`,
      };
    } else if (contentType.includes('application/json')) {
      // Handle JSON upload (with fileUrl already provided)
      try {
        body = await request.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        return NextResponse.json(
          { error: 'Invalid JSON in request body', details: jsonError instanceof Error ? jsonError.message : 'Unknown error' },
          { status: 400 }
        );
      }
    } else {
      // Try to parse as JSON with better error handling
      try {
        const text = await request.text();
        if (!text || text.trim() === '') {
          return NextResponse.json(
            { error: 'Request body is empty' },
            { status: 400 }
          );
        }
        body = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return NextResponse.json(
          { 
            error: 'Invalid request body format', 
            details: parseError instanceof Error ? parseError.message : 'Unknown error',
            contentType 
          },
          { status: 400 }
        );
      }
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object' },
        { status: 400 }
      );
    }

    const documentService = new DocumentService(prisma, session.user.companyId);

    const document = await documentService.uploadDocument({
      ...body,
      companyId: session.user.companyId,
      uploadedBy: session.user.id
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

