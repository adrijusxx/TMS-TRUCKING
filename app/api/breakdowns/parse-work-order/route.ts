import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { AIService } from '@/lib/services/AIService';
import { logger } from '@/lib/utils/logger';

interface ParsedWorkOrder {
  repairCost: number;
  towingCost: number;
  laborCost: number;
  partsCost: number;
  otherCosts: number;
  serviceProvider: string;
  serviceContact: string;
  serviceAddress: string;
  invoiceNumber: string;
  notes: string;
}

const aiService = new AIService();

/**
 * POST /api/breakdowns/parse-work-order
 * Parse work order/invoice using AI to extract cost information
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

    if (!hasPermission(session.user.role, 'trucks.edit')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Permission denied' } },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Content = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';

    // Truncate large files to avoid token limits
    const maxChars = 50000;
    const contentForAI = base64Content.length > maxChars
      ? base64Content.substring(0, maxChars)
      : base64Content;

    const prompt = `Analyze this work order/invoice document and extract cost information.
Return a JSON object with these fields:
- repairCost: total repair cost (number, 0 if not found)
- towingCost: towing cost (number, 0 if not found)
- laborCost: labor cost (number, 0 if not found)
- partsCost: parts cost (number, 0 if not found)
- otherCosts: any other costs (number, 0 if not found)
- serviceProvider: name of service provider/shop (string, empty if not found)
- serviceContact: phone or contact info (string, empty if not found)
- serviceAddress: address of service provider (string, empty if not found)
- invoiceNumber: invoice or work order number (string, empty if not found)
- notes: description of work performed (string, empty if not found)

Document (base64 ${mimeType}): ${contentForAI}`;

    const result = await aiService.callAI<ParsedWorkOrder>(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 2000,
      systemPrompt: 'You extract cost information from work orders and invoices. Return ONLY valid JSON with the exact fields requested.',
    });

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Error parsing work order', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to parse work order',
        },
      },
      { status: 500 }
    );
  }
}
