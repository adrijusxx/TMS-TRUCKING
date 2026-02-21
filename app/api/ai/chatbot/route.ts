import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AIChatbotService } from '@/lib/services/AIChatbotService';
import { z } from 'zod';

const chatbotSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  customerId: z.string().optional(),
  agentSlug: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

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
    const validated = chatbotSchema.parse(body);

    const chatbot = new AIChatbotService();
    const stream = await chatbot.processMessage({
      message: validated.message,
      companyId: session.user.companyId,
      customerId: validated.customerId,
      userId: session.user.id,
      conversationHistory: validated.conversationHistory,
      agentSlug: validated.agentSlug || 'web-chatbot',
    });

    // Return streaming response
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI chatbot error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process message',
        },
      },
      { status: 500 }
    );
  }
}



