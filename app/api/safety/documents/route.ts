import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DocumentService } from '@/lib/services/safety/DocumentService';

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

      // For now, we'll create a temporary URL structure
      // In production, you should upload to S3/Cloudinary/etc. and get the actual URL
      // TODO: Implement proper file storage (S3, Cloudinary, etc.)
      const fileUrl = `/uploads/${session.user.companyId}/${Date.now()}-${file.name}`;
      
      body = {
        fileName: file.name,
        fileUrl: fileUrl, // This should be replaced with actual storage URL
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        type: documentType || 'OTHER',
        title: file.name,
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

