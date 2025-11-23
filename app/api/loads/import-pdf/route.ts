import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLoadSchema } from '@/lib/validations/load';

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-be6d955aafb84e25bfb9c18ef425ca31';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Note: In production, store the API key in environment variables
// Add DEEPSEEK_API_KEY=your_key_here to your .env file

interface StopItem {
  orderId?: string;
  item?: string;
  product?: string;
  pieces?: number;
  weight?: number;
  description?: string;
}

interface LoadStop {
  stopType: 'PICKUP' | 'DELIVERY';
  sequence: number;
  company?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  earliestArrival?: string;
  latestArrival?: string;
  contactName?: string;
  contactPhone?: string;
  items?: StopItem[];
  totalPieces?: number;
  totalWeight?: number;
  notes?: string;
  specialInstructions?: string;
}

interface ExtractedLoadData {
  loadNumber?: string;
  customerName?: string;
  customerNumber?: string;
  // Single pickup/delivery (for backward compatibility)
  pickupLocation?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupZip?: string;
  pickupDate?: string;
  pickupTimeStart?: string;
  pickupTimeEnd?: string;
  pickupContact?: string;
  pickupPhone?: string;
  deliveryLocation?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryDate?: string;
  deliveryTimeStart?: string;
  deliveryTimeEnd?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  // Multi-stop support
  stops?: LoadStop[];
  // Load details
  weight?: number;
  pieces?: number;
  commodity?: string;
  pallets?: number;
  temperature?: string;
  equipmentType?: string;
  loadType?: string;
  revenue?: number;
  driverPay?: number;
  fuelAdvance?: number;
  hazmat?: boolean;
  hazmatClass?: string;
  dispatchNotes?: string;
  pickupNotes?: string;
  deliveryNotes?: string;
  totalMiles?: number;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid issues in Next.js
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    
    let text = data.text;
    
    // Optimize: Remove excessive whitespace and normalize line breaks
    // This reduces token count without losing information
    text = text
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();
    
    // For rate confirmations, we typically only need the first portion
    // Most rate confirmations are 1-3 pages, so limit to first 25k chars (balanced for speed and accuracy)
    if (text.length > 25000) {
      // Take first 25k characters (roughly 2-3 pages)
      // This is usually enough for rate confirmations while maintaining accuracy
      text = text.substring(0, 25000);
    }
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
  }
}

async function extractLoadDataWithAI(pdfText: string): Promise<ExtractedLoadData> {
  // Optimized: More concise prompt for faster processing
  // Reduced from ~200 lines to ~80 lines while maintaining all functionality
  const prompt = `Extract load data from rate confirmation PDF. Return ONLY valid JSON, no markdown.

REQUIRED FIELDS:
- loadNumber: Load/confirmation number (REQUIRED)
- customerName: Shipper/customer name (REQUIRED - look for "Shipper", "Customer", "Bill To", etc.)

MULTI-STOP (preferred): stops array with stopType ("PICKUP"/"DELIVERY"), sequence, company, address, city, state, zip, phone, earliestArrival, latestArrival (ISO: YYYY-MM-DDTHH:MM), contactName, contactPhone, items[], totalPieces, totalWeight, notes, specialInstructions

SINGLE-STOP: pickupLocation, pickupAddress, pickupCity, pickupState, pickupZip, pickupDate (ISO: YYYY-MM-DD), pickupTimeStart/End (HH:MM), pickupContact/Phone, deliveryLocation, deliveryAddress, deliveryCity, deliveryState, deliveryZip, deliveryDate, deliveryTimeStart/End, deliveryContact/Phone

LOAD DETAILS: weight, pieces, commodity, pallets, temperature, equipmentType (DRY_VAN/REEFER/FLATBED/STEP_DECK/LOWBOY/TANKER/CONESTOGA/POWER_ONLY/HOTSHOT), loadType (FTL/LTL/PARTIAL/INTERMODAL), revenue, driverPay, fuelAdvance, totalMiles, hazmat (boolean), hazmatClass, dispatchNotes, pickupNotes, deliveryNotes

DATE FORMAT: Convert all dates to ISO (YYYY-MM-DDTHH:MM:SS). For "11-14-25 17:00" = "2025-11-14T17:00:00". Use 2025 if year ambiguous.

PDF Text:
${pdfText.substring(0, 8000)}

Return ONLY JSON:`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'Extract structured data. Return ONLY valid JSON, no markdown, no code blocks.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 5000, // Balanced: Enough for complex loads but faster than 6000
            stream: false,
          }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`AI processing failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Check if response was truncated (finish_reason === 'length')
    const finishReason = data.choices?.[0]?.finish_reason;
    const wasTruncated = finishReason === 'length';
    
    // Clean the response - remove markdown code blocks if present
    let jsonText = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/g, '').replace(/\s*```$/g, '');
    }
    
    // Try to extract JSON object if wrapped in text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Function to fix incomplete JSON by closing open structures
    const fixIncompleteJSON = (text: string): string => {
      let fixed = text.trim();
      
      // Remove trailing commas before closing brackets/braces
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Count open/close braces and brackets
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      
      // If JSON appears incomplete, try to close it
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        // Find the last complete value before the truncation
        // Look for the last complete object or array
        let lastValidIndex = -1;
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < fixed.length; i++) {
          const char = fixed[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{' || char === '[') {
              depth++;
            } else if (char === '}' || char === ']') {
              depth--;
              if (depth === 0) {
                lastValidIndex = i;
              }
            } else if (char === ',' && depth === 1) {
              // At top level, this might be a good place to cut
              const nextChar = fixed.substring(i + 1).trim()[0];
              if (nextChar === '{' || nextChar === '[') {
                // This is between top-level objects, safe to cut here
                lastValidIndex = i;
              }
            }
          }
        }
        
        // If we found a good cut point, use it
        if (lastValidIndex > 0) {
          fixed = fixed.substring(0, lastValidIndex + 1);
        }
        
        // Close any remaining open structures
        const bracesToClose = openBraces - closeBraces;
        const bracketsToClose = openBrackets - closeBrackets;
        
        // Close arrays first, then objects
        fixed += '\n' + ']'.repeat(bracketsToClose);
        fixed += '\n' + '}'.repeat(bracesToClose);
      }
      
      return fixed;
    };
    
    try {
      const extracted = JSON.parse(jsonText);
      return extracted as ExtractedLoadData;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response was truncated:', wasTruncated);
      console.error('Response text length:', jsonText.length);
      console.error('Response text (first 1000 chars):', jsonText.substring(0, 1000));
      console.error('Response text (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // Try to fix incomplete JSON
      try {
        const fixedJson = fixIncompleteJSON(jsonText);
        console.log('Attempting to parse fixed JSON (length:', fixedJson.length, ')...');
        const extracted = JSON.parse(fixedJson);
        console.log('Successfully parsed fixed JSON');
        return extracted as ExtractedLoadData;
      } catch (fixError) {
        console.error('Failed to fix JSON:', fixError);
        // Log more details for debugging
        if (parseError instanceof SyntaxError) {
          const errorMessage = parseError.message;
          const positionMatch = errorMessage.match(/position (\d+)/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const start = Math.max(0, position - 200);
            const end = Math.min(jsonText.length, position + 200);
            console.error('Error around position', position, ':', jsonText.substring(start, end));
          }
        }
        throw new Error(
          wasTruncated 
            ? 'AI response was too long and got truncated. The PDF may have too many stops. Please try a simpler PDF or contact support.'
            : 'Failed to parse AI response as JSON. Please try again or upload a clearer PDF.'
        );
      }
    }
  } catch (error) {
    console.error('AI extraction error:', error);
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes('parse'))) {
      throw new Error('Failed to parse AI response. The PDF may be too complex or unclear.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during AI extraction');
  }
}

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

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
        },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File must be a PDF' },
        },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'File size must be less than 10MB' },
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(buffer);

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'PDF appears to be empty or unreadable' },
        },
        { status: 400 }
      );
    }

    // Extract load data using AI
    const extractedData = await extractLoadDataWithAI(pdfText);

    // Try to match customer if customerName or customerNumber is provided
    // Optimized: Use more efficient query - check customerNumber first (indexed), then name
    let customerId: string | undefined;
    let customerMatched = false;
    let customerCreated = false;
    
    if (extractedData.customerName || extractedData.customerNumber) {
      let customer = null;
      
      // Optimize: Check customerNumber first (usually indexed and faster)
      if (extractedData.customerNumber) {
        customer = await prisma.customer.findFirst({
          where: {
            companyId: session.user.companyId,
            customerNumber: extractedData.customerNumber,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, name: true },
        });
        if (customer) {
          customerMatched = true;
          console.log(`Customer matched by number: ${customer.name} (${extractedData.customerNumber})`);
        }
      }
      
      // If not found by number, try exact name match first
      if (!customer && extractedData.customerName) {
        customer = await prisma.customer.findFirst({
          where: {
            companyId: session.user.companyId,
            name: { equals: extractedData.customerName, mode: Prisma.QueryMode.insensitive },
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, name: true },
        });
        if (customer) {
          customerMatched = true;
          console.log(`Customer matched by exact name: ${customer.name}`);
        }
      }
      
      // If still not found, try partial name match
      if (!customer && extractedData.customerName) {
        customer = await prisma.customer.findFirst({
          where: {
            companyId: session.user.companyId,
            name: { contains: extractedData.customerName, mode: Prisma.QueryMode.insensitive },
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, name: true },
        });
        if (customer) {
          customerMatched = true;
          console.log(`Customer matched by partial name: ${customer.name} (searched: ${extractedData.customerName})`);
        }
      }

      // If customer not found, create a new one
      if (!customer && extractedData.customerName) {
        // Generate customer number if not provided
        const customerNumber = extractedData.customerNumber || `CUST-${Date.now()}`;
        
        console.log(`Creating new customer: ${extractedData.customerName} (${customerNumber})`);
        
        const newCustomer = await prisma.customer.create({
          data: {
            companyId: session.user.companyId,
            name: extractedData.customerName,
            customerNumber,
            type: 'DIRECT', // Default customer type
            address: '', // Required field - set empty if not available
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: '',
            isActive: true,
            // Set default payment terms (30 days)
            paymentTerms: 30,
          },
          select: { id: true, name: true },
        });
        customer = { id: newCustomer.id, name: newCustomer.name };
        customerCreated = true;
        console.log(`New customer created: ${newCustomer.name} (ID: ${newCustomer.id})`);
      }

      if (customer) {
        customerId = customer.id;
      }
    }

    // Helper function to convert date to datetime-local format for HTML input
    const formatDateForInput = (dateStr: string | undefined, timeStr?: string): string | undefined => {
      if (!dateStr) return undefined;
      try {
        // Try to parse the date string
        let date: Date;
        
        // Handle various date formats
        if (dateStr.includes('T')) {
          // ISO format with time
          date = new Date(dateStr);
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD format
          date = new Date(dateStr + 'T00:00:00');
        } else {
          // Try to parse as-is
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', dateStr);
          return undefined;
        }
        
        // Format as YYYY-MM-DDTHH:MM for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Parse time if provided (HH:MM format)
        let hours = '00';
        let minutes = '00';
        if (timeStr) {
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const parsedHours = parseInt(timeMatch[1]);
            hours = String(parsedHours % 24).padStart(2, '0');
            minutes = timeMatch[2];
          }
        } else if (dateStr.includes('T')) {
          // Extract time from ISO string
          const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
          if (timeMatch) {
            hours = timeMatch[1];
            minutes = timeMatch[2];
          }
        }
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.warn('Date formatting error:', error, dateStr);
        return undefined;
      }
    };

    // Process stops if available (multi-stop load)
    let processedStops: LoadStop[] | undefined;
    if (extractedData.stops && Array.isArray(extractedData.stops) && extractedData.stops.length > 0) {
      processedStops = extractedData.stops.map((stop, index) => {
        // Format dates for stops
        const formatStopDate = (dateStr: string | undefined): string | undefined => {
          if (!dateStr) return undefined;
          try {
            // Try to parse ISO format or other formats
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return undefined;
            return date.toISOString();
          } catch {
            return undefined;
          }
        };

        return {
          ...stop,
          state: stop.state?.toUpperCase().slice(0, 2) || '',
          earliestArrival: formatStopDate(stop.earliestArrival),
          latestArrival: formatStopDate(stop.latestArrival),
          // Ensure sequence is set if not provided
          sequence: stop.sequence || index + 1,
        };
      });
    }

    // Prepare response with extracted data
    const response: any = {
      ...extractedData,
      customerId,
      // Multi-stop support
      stops: processedStops,
      // Convert dates to datetime-local format for form inputs (single-stop fallback)
      pickupDate: extractedData.stops 
        ? undefined 
        : formatDateForInput(extractedData.pickupDate, extractedData.pickupTimeStart),
      deliveryDate: extractedData.stops 
        ? undefined 
        : formatDateForInput(extractedData.deliveryDate, extractedData.deliveryTimeStart),
      // Remove separate time fields as they're now combined with dates
      pickupTimeStart: extractedData.stops ? undefined : undefined,
      pickupTimeEnd: extractedData.stops ? undefined : undefined,
      deliveryTimeStart: extractedData.stops ? undefined : undefined,
      deliveryTimeEnd: extractedData.stops ? undefined : undefined,
      // Ensure equipmentType is uppercase and valid
      equipmentType: extractedData.equipmentType?.toUpperCase().replace(/-/g, '_') || 'DRY_VAN',
      // Ensure loadType is uppercase
      loadType: extractedData.loadType?.toUpperCase() || 'FTL',
      // Ensure state codes are uppercase and 2 characters (for single-stop fallback)
      pickupState: extractedData.stops 
        ? undefined 
        : extractedData.pickupState?.toUpperCase().slice(0, 2),
      deliveryState: extractedData.stops 
        ? undefined 
        : extractedData.deliveryState?.toUpperCase().slice(0, 2),
      // Store total miles if extracted
      totalMiles: extractedData.totalMiles,
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        customerMatched,
        customerCreated,
        extractedFields: Object.keys(extractedData).filter(k => 
          // Count only actual data fields, not metadata
          !['customerName', 'customerNumber'].includes(k) && extractedData[k as keyof ExtractedLoadData] !== undefined
        ).length,
      },
    });
  } catch (error) {
    console.error('PDF import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process PDF',
        },
      },
      { status: 500 }
    );
  }
}

