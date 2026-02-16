
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/services/AIService';

// -----------------------------------------------------------------------------
// POST /api/import-export/analyze-file
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { headers, sampleData, entityType } = body;

        if (!headers || !Array.isArray(headers) || headers.length === 0) {
            return NextResponse.json({ error: 'Invalid or missing headers' }, { status: 400 });
        }

        // Initialize AI Service
        const aiService = new AIService();

        // Construct Prompt
        const prompt = `
        You are a Data Import Assistant for a Transport Management System (TMS).
        The user is uploading a file to import **${entityType}** data.

        **File Headers:**
        ${JSON.stringify(headers)}

        **Sample Data (First 3 rows):**
        ${JSON.stringify(sampleData.slice(0, 3))}

        **Your Goal:**
        Analyze this file structure and data content. Provide a helpful summary and 3-4 specific tips or observations to help the user map their data correctly.
        Identify any potential issues (e.g., combined address fields, ambiguous dates, missing critical columns).

        **Return JSON ONLY:**
        {
            "summary": "Brief, friendly analysis of the file quality and content (1-2 sentences).",
            "tips": [
                "Tip 1: Observation about specific column mapping.",
                "Tip 2: Advice on data formatting.",
                "Tip 3: Warning about potential issues."
            ],
            "confidence": "High" | "Medium" | "Low",
            "suggestedMapping": { "CSV Header": "systemField" } 
        }
        
        System Fields for ${entityType} include: [loadNumber, customerId, driverId, truckId, pickupDate, deliveryDate, origin, destination, revenue, weight, miles].
        `;

        // Call AI
        const result = await aiService.callAI(prompt, {
            systemPrompt: "You are a helpful TMS Data Import Assistant. Return valid JSON only.",
            temperature: 0.2, // Low temp for more consistent analysis
            jsonMode: true
        });

        return NextResponse.json(result.data);

    } catch (error: any) {
        console.error('[API] File Analysis Failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze file' },
            { status: 500 }
        );
    }
}
