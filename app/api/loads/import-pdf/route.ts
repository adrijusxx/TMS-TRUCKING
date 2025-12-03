import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-be6d955aafb84e25bfb9c18ef425ca31';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Accounting-critical fields that MUST be extracted for invoicing/settlements
const CRITICAL_FIELDS = ['loadNumber', 'customerName', 'revenue', 'weight'] as const;
const IMPORTANT_FIELDS = ['pickupAddress', 'pickupCity', 'pickupState', 'deliveryAddress', 'deliveryCity', 'deliveryState'] as const;

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
  pickupCompany?: string;
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
  deliveryCompany?: string;
  stops?: LoadStop[];
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
  loadedMiles?: number;
  emptyMiles?: number;
}

interface ExtractionResult {
  data: ExtractedLoadData;
  missingCritical: string[];
  missingImportant: string[];
  extractedCount: number;
  confidence: 'high' | 'medium' | 'low';
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    
    let text = data.text;
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    // Increase limit to 30k chars for better extraction
    if (text.length > 30000) {
      text = text.substring(0, 30000);
    }
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
  }
}

/**
 * Enhanced AI prompt with explicit field requirements and examples
 */
function buildExtractionPrompt(pdfText: string, pass: 'full' | 'financial' | 'details' = 'full'): string {
  if (pass === 'financial') {
    return `Extract ONLY financial and mileage data from this rate confirmation. Return valid JSON only.

REQUIRED FINANCIAL FIELDS (extract ALL that are present):
- revenue: Total rate/pay amount in dollars (look for "Rate:", "Total:", "Amount:", "$")
- weight: Total weight in lbs (look for "Weight:", "lbs", "pounds")
- totalMiles: Total miles (look for "Miles:", "Distance:", "Total Miles")
- loadedMiles: Loaded miles if separate from total
- emptyMiles: Empty/deadhead miles if listed
- pieces: Number of pieces/units
- pallets: Number of pallets

Look for dollar amounts like "$2,500.00" or "2500" near words like Rate, Total, Amount.
Look for weight like "42,000 lbs" or "42000 pounds".

PDF Text:
${pdfText.substring(0, 12000)}

Return ONLY JSON with these fields:`;
  }
  
  if (pass === 'details') {
    return `Extract contact and detail information from this rate confirmation. Return valid JSON only.

DETAIL FIELDS TO EXTRACT:
- pickupContact: Contact person name at pickup
- pickupPhone: Phone number at pickup
- pickupCompany: Company name at pickup location
- pickupNotes: Special instructions for pickup
- deliveryContact: Contact person name at delivery
- deliveryPhone: Phone number at delivery
- deliveryCompany: Company name at delivery location
- deliveryNotes: Special instructions for delivery
- commodity: What is being shipped
- temperature: Temperature requirement (for reefer)
- hazmat: true/false if hazardous materials
- hazmatClass: Hazmat class if applicable
- dispatchNotes: Any general notes or instructions

PDF Text:
${pdfText.substring(0, 12000)}

Return ONLY JSON with these fields:`;
  }

  // Full extraction prompt - comprehensive
  return `Extract ALL load data from this rate confirmation PDF. Return ONLY valid JSON, no markdown.

## ACCOUNTING-CRITICAL FIELDS (REQUIRED - extract carefully):
- loadNumber: Load/confirmation/reference number (REQUIRED - look for "Load #", "Confirmation #", "Reference #", "Order #")
- customerName: Broker/customer name (REQUIRED - look for "Shipper", "Customer", "Bill To", "Broker", company name at top)
- revenue: Total rate amount in dollars (REQUIRED - look for "Rate:", "Total:", "Amount:", "$X,XXX.XX")
- weight: Total weight in lbs (REQUIRED - look for "Weight:", "lbs", "pounds", "42,000")

## LOCATION FIELDS (extract all available):
### Pickup:
- pickupLocation: Facility/location name
- pickupAddress: Street address
- pickupCity: City name
- pickupState: 2-letter state code (e.g., TX, CA)
- pickupZip: ZIP code
- pickupDate: Date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM)
- pickupTimeStart: Earliest pickup time
- pickupTimeEnd: Latest pickup time
- pickupContact: Contact person name
- pickupPhone: Contact phone
- pickupCompany: Company name at pickup

### Delivery:
- deliveryLocation: Facility/location name
- deliveryAddress: Street address
- deliveryCity: City name
- deliveryState: 2-letter state code
- deliveryZip: ZIP code
- deliveryDate: Date in ISO format
- deliveryTimeStart: Earliest delivery time
- deliveryTimeEnd: Latest delivery time
- deliveryContact: Contact person name
- deliveryPhone: Contact phone
- deliveryCompany: Company name at delivery

## MULTI-STOP (if more than 1 pickup or delivery):
- stops: Array of objects with: stopType ("PICKUP"/"DELIVERY"), sequence (1,2,3...), company, address, city, state, zip, phone, earliestArrival (ISO), latestArrival (ISO), contactName, contactPhone, notes

## LOAD DETAILS:
- pieces: Number of pieces/units
- commodity: What is being shipped
- pallets: Number of pallets
- temperature: Temperature setting (reefer loads)
- equipmentType: DRY_VAN, REEFER, FLATBED, STEP_DECK, LOWBOY, TANKER, CONESTOGA, POWER_ONLY, HOTSHOT
- loadType: FTL, LTL, PARTIAL, INTERMODAL
- totalMiles: Total miles for the load
- loadedMiles: Loaded miles
- emptyMiles: Empty/deadhead miles
- hazmat: true/false
- hazmatClass: Hazmat classification if hazmat=true
- dispatchNotes: Special instructions

## DATE FORMAT:
Convert dates to ISO: "11-14-25 17:00" = "2025-11-14T17:00:00"
Use current year (2025) if year is ambiguous.

## EXAMPLES:
- "Rate: $2,500.00" → revenue: 2500
- "Weight: 42,000 lbs" → weight: 42000
- "Load # 123456" → loadNumber: "123456"
- "TQL Logistics" → customerName: "TQL Logistics"

PDF Text:
${pdfText.substring(0, 15000)}

Return ONLY valid JSON:`;
}

/**
 * Call AI API for extraction
 */
async function callAIForExtraction(prompt: string, maxTokens: number = 6000): Promise<ExtractedLoadData> {
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
          content: 'You are a data extraction expert. Extract structured data from documents. Return ONLY valid JSON, no markdown, no code blocks, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.05, // Very low for consistency
      max_tokens: maxTokens,
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
  
  return parseAIResponse(content);
}

/**
 * Parse and clean AI response
 */
function parseAIResponse(content: string): ExtractedLoadData {
  let jsonText = content.trim();
  
  // Remove markdown code blocks
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/g, '').replace(/\s*```$/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/g, '').replace(/\s*```$/g, '');
  }
  
  // Extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }
  
  try {
    return JSON.parse(jsonText) as ExtractedLoadData;
  } catch (parseError) {
    // Try to fix incomplete JSON
    const fixed = fixIncompleteJSON(jsonText);
    return JSON.parse(fixed) as ExtractedLoadData;
  }
}

/**
 * Fix incomplete JSON by closing open structures
 */
function fixIncompleteJSON(text: string): string {
  let fixed = text.trim();
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  return fixed;
}

/**
 * Validate extraction results and identify missing fields
 */
function validateExtraction(data: ExtractedLoadData): ExtractionResult {
  const missingCritical: string[] = [];
  const missingImportant: string[] = [];
  
  // Check critical fields
  for (const field of CRITICAL_FIELDS) {
    const value = data[field as keyof ExtractedLoadData];
    if (value === undefined || value === null || value === '') {
      missingCritical.push(field);
    }
  }
  
  // Check important fields (only if no stops - stops contain their own location data)
  if (!data.stops || data.stops.length === 0) {
    for (const field of IMPORTANT_FIELDS) {
      const value = data[field as keyof ExtractedLoadData];
      if (value === undefined || value === null || value === '') {
        missingImportant.push(field);
      }
    }
  }
  
  // Count extracted fields
  const extractedCount = Object.keys(data).filter(k => {
    const val = data[k as keyof ExtractedLoadData];
    return val !== undefined && val !== null && val !== '';
  }).length;
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (missingCritical.length > 0) {
    confidence = 'low';
  } else if (missingImportant.length > 2) {
    confidence = 'medium';
  }
  
  return {
    data,
    missingCritical,
    missingImportant,
    extractedCount,
    confidence,
  };
}

/**
 * Multi-pass extraction strategy for comprehensive data extraction
 */
async function extractLoadDataWithMultiPass(pdfText: string): Promise<ExtractionResult> {
  // Pass 1: Full extraction
  console.log('[PDF Import] Starting full extraction pass...');
  let extractedData = await callAIForExtraction(buildExtractionPrompt(pdfText, 'full'), 8000);
  let result = validateExtraction(extractedData);
  
  console.log(`[PDF Import] Pass 1: Extracted ${result.extractedCount} fields, missing critical: ${result.missingCritical.join(', ') || 'none'}`);
  
  // Pass 2: If critical financial fields missing, do focused financial extraction
  if (result.missingCritical.includes('revenue') || result.missingCritical.includes('weight')) {
    console.log('[PDF Import] Starting financial extraction pass...');
    try {
      const financialData = await callAIForExtraction(buildExtractionPrompt(pdfText, 'financial'), 3000);
      
      // Merge financial data into main data
      if (financialData.revenue && !extractedData.revenue) {
        extractedData.revenue = financialData.revenue;
      }
      if (financialData.weight && !extractedData.weight) {
        extractedData.weight = financialData.weight;
      }
      if (financialData.totalMiles && !extractedData.totalMiles) {
        extractedData.totalMiles = financialData.totalMiles;
      }
      if (financialData.loadedMiles && !extractedData.loadedMiles) {
        extractedData.loadedMiles = financialData.loadedMiles;
      }
      if (financialData.pieces && !extractedData.pieces) {
        extractedData.pieces = financialData.pieces;
      }
      if (financialData.pallets && !extractedData.pallets) {
        extractedData.pallets = financialData.pallets;
      }
      
      result = validateExtraction(extractedData);
      console.log(`[PDF Import] Pass 2: Now have ${result.extractedCount} fields`);
    } catch (error) {
      console.error('[PDF Import] Financial pass failed:', error);
    }
  }
  
  // Pass 3: If still missing critical fields, try one more focused extraction
  if (result.missingCritical.length > 0 && result.confidence === 'low') {
    console.log('[PDF Import] Starting retry extraction for critical fields...');
    const retryPrompt = `Extract ONLY these specific fields from the rate confirmation:
${result.missingCritical.map(f => `- ${f}`).join('\n')}

Look very carefully for:
${result.missingCritical.includes('loadNumber') ? '- Load number, confirmation number, reference number, order number' : ''}
${result.missingCritical.includes('customerName') ? '- Customer name, broker name, shipper name, "Bill To" company' : ''}
${result.missingCritical.includes('revenue') ? '- Rate amount, total amount, dollar value (look for $ signs)' : ''}
${result.missingCritical.includes('weight') ? '- Weight in lbs or pounds' : ''}

PDF Text:
${pdfText.substring(0, 10000)}

Return ONLY JSON:`;

    try {
      const retryData = await callAIForExtraction(retryPrompt, 2000);
      
      // Merge retry data
      for (const field of result.missingCritical) {
        const value = retryData[field as keyof ExtractedLoadData];
        if (value !== undefined && value !== null && value !== '') {
          (extractedData as any)[field] = value;
        }
      }
      
      result = validateExtraction(extractedData);
      console.log(`[PDF Import] Retry pass: Now have ${result.extractedCount} fields, missing critical: ${result.missingCritical.join(', ') || 'none'}`);
    } catch (error) {
      console.error('[PDF Import] Retry pass failed:', error);
    }
  }
  
  return result;
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be a PDF' } },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File size must be less than 10MB' } },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfText = await extractTextFromPDF(buffer);

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'PDF appears to be empty or unreadable' } },
        { status: 400 }
      );
    }

    // Use multi-pass extraction
    const extractionResult = await extractLoadDataWithMultiPass(pdfText);
    const extractedData = extractionResult.data;

    // Match or create customer
    let customerId: string | undefined;
    let customerMatched = false;
    let customerCreated = false;
    
    if (extractedData.customerName || extractedData.customerNumber) {
      let customer = null;
      
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
        if (customer) customerMatched = true;
      }
      
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
        if (customer) customerMatched = true;
      }
      
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
        if (customer) customerMatched = true;
      }

      if (!customer && extractedData.customerName) {
        const customerNumber = extractedData.customerNumber || `CUST-${Date.now()}`;
        const newCustomer = await prisma.customer.create({
          data: {
            companyId: session.user.companyId,
            name: extractedData.customerName,
            customerNumber,
            type: 'BROKER',
            address: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: '',
            isActive: true,
            paymentTerms: 30,
          },
          select: { id: true, name: true },
        });
        customer = { id: newCustomer.id, name: newCustomer.name };
        customerCreated = true;
      }

      if (customer) {
        customerId = customer.id;
      }
    }

    // Format dates helper
    const formatDateForInput = (dateStr: string | undefined, timeStr?: string): string | undefined => {
      if (!dateStr) return undefined;
      try {
        let date: Date;
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateStr + 'T00:00:00');
        } else {
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) return undefined;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        let hours = '00';
        let minutes = '00';
        if (timeStr) {
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hours = String(parseInt(timeMatch[1]) % 24).padStart(2, '0');
            minutes = timeMatch[2];
          }
        } else if (dateStr.includes('T')) {
          const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
          if (timeMatch) {
            hours = timeMatch[1];
            minutes = timeMatch[2];
          }
        }
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        return undefined;
      }
    };

    // Process stops
    let processedStops: LoadStop[] | undefined;
    if (extractedData.stops && Array.isArray(extractedData.stops) && extractedData.stops.length > 0) {
      processedStops = extractedData.stops.map((stop, index) => {
        const formatStopDate = (dateStr: string | undefined): string | undefined => {
          if (!dateStr) return undefined;
          try {
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
          sequence: stop.sequence || index + 1,
        };
      });
    }

    // Build response
    const response: any = {
      ...extractedData,
      customerId,
      stops: processedStops,
      pickupDate: extractedData.stops 
        ? undefined 
        : formatDateForInput(extractedData.pickupDate, extractedData.pickupTimeStart),
      deliveryDate: extractedData.stops 
        ? undefined 
        : formatDateForInput(extractedData.deliveryDate, extractedData.deliveryTimeStart),
      pickupTimeStart: undefined,
      pickupTimeEnd: undefined,
      deliveryTimeStart: undefined,
      deliveryTimeEnd: undefined,
      equipmentType: extractedData.equipmentType?.toUpperCase().replace(/-/g, '_') || 'DRY_VAN',
      loadType: extractedData.loadType?.toUpperCase() || 'FTL',
      pickupState: extractedData.stops 
        ? undefined 
        : extractedData.pickupState?.toUpperCase().slice(0, 2),
      deliveryState: extractedData.stops 
        ? undefined 
        : extractedData.deliveryState?.toUpperCase().slice(0, 2),
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        customerMatched,
        customerCreated,
        extractedFields: extractionResult.extractedCount,
        missingCritical: extractionResult.missingCritical,
        missingImportant: extractionResult.missingImportant,
        confidence: extractionResult.confidence,
        // Accounting validation warnings
        accountingWarnings: buildAccountingWarnings(extractionResult),
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

/**
 * Build accounting-specific warnings for the frontend
 */
function buildAccountingWarnings(result: ExtractionResult): string[] {
  const warnings: string[] = [];
  
  if (result.missingCritical.includes('revenue')) {
    warnings.push('Revenue not extracted - required for invoicing. Please enter manually.');
  }
  if (result.missingCritical.includes('weight')) {
    warnings.push('Weight not extracted - required for BOL validation. Please enter manually.');
  }
  if (result.missingCritical.includes('loadNumber')) {
    warnings.push('Load number not extracted - will be auto-generated if not provided.');
  }
  if (result.missingCritical.includes('customerName')) {
    warnings.push('Customer/broker not identified - must be selected before saving.');
  }
  if (!result.data.totalMiles && !result.data.loadedMiles) {
    warnings.push('Mileage not extracted - driver pay calculation may be affected.');
  }
  
  return warnings;
}
