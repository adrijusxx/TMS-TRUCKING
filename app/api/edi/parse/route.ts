import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { parseEDI } from '@/lib/edi/parser';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = body.content || body.ediContent;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_CONTENT', message: 'EDI content is required' },
        },
        { status: 400 }
      );
    }

    const parsed = parseEDI(content);

    return NextResponse.json({
      success: true,
      data: {
        type: parsed.type,
        segments: parsed.segments,
        segmentCount: parsed.segments.length,
      },
    });
  } catch (error) {
    console.error('EDI parsing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to parse EDI file' },
      },
      { status: 500 }
    );
  }
}

