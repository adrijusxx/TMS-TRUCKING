/**
 * Document OCR Service
 *
 * Provides intelligent text extraction with automatic OCR fallback.
 * Uses pdf-parse for digital PDFs (fast, free) and GPT-4o vision
 * for scanned/image documents.
 *
 * Supports: PDF, PNG, JPEG
 */

// ============================================
// CONFIGURATION
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const VISION_MODEL = 'gpt-4o';

/** Minimum chars from pdf-parse to consider text "meaningful" */
const MIN_TEXT_LENGTH = 50;
/** Minimum ratio of printable characters to total */
const MIN_PRINTABLE_RATIO = 0.7;
/** Minimum word count to consider text meaningful */
const MIN_WORD_COUNT = 10;
/** Max text output from OCR */
const MAX_OCR_TEXT = 25000;

// ============================================
// TYPES
// ============================================

export interface OCRExtractionResult {
  text: string;
  method: 'pdf-parse' | 'vision-ocr';
  pageCount?: number;
  confidence: 'high' | 'medium' | 'low';
  latencyMs: number;
}

type SupportedMimeType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg';

const IMAGE_MIME_TYPES: string[] = ['image/png', 'image/jpeg', 'image/jpg'];

// ============================================
// SERVICE
// ============================================

export class DocumentOCRService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  /**
   * Extract text from a document buffer.
   * For images: uses GPT-4o vision directly.
   * For PDFs: tries pdf-parse first, falls back to vision if text is insufficient.
   */
  async extractText(buffer: Buffer, mimeType: string): Promise<OCRExtractionResult> {
    const startTime = Date.now();

    if (IMAGE_MIME_TYPES.includes(mimeType)) {
      return this.extractFromImage(buffer, mimeType, startTime);
    }

    if (mimeType === 'application/pdf') {
      return this.extractFromPDF(buffer, startTime);
    }

    throw new Error(`Unsupported file type: ${mimeType}. Supported: PDF, PNG, JPEG`);
  }

  /**
   * Extract text from an image using GPT-4o vision
   */
  private async extractFromImage(
    buffer: Buffer,
    mimeType: string,
    startTime: number
  ): Promise<OCRExtractionResult> {
    const text = await this.callVisionOCR(buffer, mimeType);
    return {
      text,
      method: 'vision-ocr',
      confidence: text.length > 200 ? 'high' : text.length > 50 ? 'medium' : 'low',
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Extract text from PDF: try pdf-parse first, fall back to vision
   */
  private async extractFromPDF(buffer: Buffer, startTime: number): Promise<OCRExtractionResult> {
    // Try fast text extraction first
    const pdfText = await this.tryPdfParse(buffer);

    if (pdfText && this.isTextMeaningful(pdfText)) {
      console.log(`[DocumentOCR] pdf-parse extracted ${pdfText.length} chars (fast path)`);
      return {
        text: pdfText,
        method: 'pdf-parse',
        confidence: 'high',
        latencyMs: Date.now() - startTime,
      };
    }

    // Scanned PDF — use GPT-4o vision
    console.log('[DocumentOCR] pdf-parse returned insufficient text, using GPT-4o vision...');
    const visionText = await this.callVisionOCR(buffer, 'application/pdf');
    return {
      text: visionText,
      method: 'vision-ocr',
      confidence: visionText.length > 200 ? 'high' : visionText.length > 50 ? 'medium' : 'low',
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Attempt pdf-parse text extraction. Returns null on failure.
   */
  private async tryPdfParse(buffer: Buffer): Promise<string | null> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      let text = data.text || '';

      text = text
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      if (text.length > MAX_OCR_TEXT) {
        text = text.substring(0, MAX_OCR_TEXT);
      }

      return text;
    } catch (error) {
      console.warn('[DocumentOCR] pdf-parse failed:', error);
      return null;
    }
  }

  /**
   * Check if extracted text contains meaningful content (not garbage from a scanned PDF)
   */
  private isTextMeaningful(text: string): boolean {
    if (text.length < MIN_TEXT_LENGTH) return false;

    // Check ratio of printable ASCII + common Unicode to total chars
    const printable = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
    if (printable.length / text.length < MIN_PRINTABLE_RATIO) return false;

    // Check word count — scanned PDFs often produce random chars, not real words
    const words = text.split(/\s+/).filter(w => w.length >= 2);
    if (words.length < MIN_WORD_COUNT) return false;

    return true;
  }

  /**
   * Call GPT-4o vision to extract text from a document image or scanned PDF
   */
  private async callVisionOCR(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OCR');
    }

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const systemPrompt = [
      'You are a document OCR specialist. Extract ALL text from the provided document.',
      'Preserve the layout, structure, tables, and formatting as closely as possible.',
      'For tables, use pipe-delimited format. For forms, preserve field labels and values.',
      'Return ONLY the extracted text content, nothing else.',
    ].join(' ');

    const requestBody = {
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this document. Preserve layout and structure.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DocumentOCR] Vision API error:', errorText);
      throw new Error(`OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens;

    console.log(`[DocumentOCR] Vision OCR extracted ${content.length} chars (${tokens} tokens)`);

    return content.trim();
  }
}

// Singleton
let instance: DocumentOCRService | null = null;
export function getDocumentOCRService(): DocumentOCRService {
  if (!instance) instance = new DocumentOCRService();
  return instance;
}
