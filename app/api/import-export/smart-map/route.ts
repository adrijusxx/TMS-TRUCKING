import { auth } from '@/lib/auth';
import { NextResponse, NextRequest } from 'next/server';
import { AIService } from '@/lib/services/AIService';

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { csvHeaders, systemFields } = await req.json();

        if (!Array.isArray(csvHeaders) || !Array.isArray(systemFields)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const aiService = new AIService();

        const prompt = `
        Act as a TMS data expert. Map the following CSV headers to our system field names.
        CSV Headers: [${csvHeaders.join(', ')}]
        System Fields: [${systemFields.join(', ')}]

        Return ONLY a JSON object where keys are CSV headers and values are the best system field matches (use the system field KEY provided).
        If no match is clear, omit the key.
        Example Input Headers: ["Unit#", "Pay Rate", "Random Junk"]
        Example Output JSON: {"Unit#": "unit_number", "Pay Rate": "payRate"}
        `;

        const result = await aiService.callAI(prompt, {
            systemPrompt: "You are a data mapping assistant. Return ONLY valid JSON.",
            jsonMode: true,
            temperature: 0.1
        });

        return NextResponse.json({ mapping: result.data || {} });
    } catch (error) {
        console.error('[SmartMap API] Critical error:', error);
        return NextResponse.json({ error: 'Failed to process mapping' }, { status: 500 });
    }
}
