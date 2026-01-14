/**
 * Base AI Service
 * 
 * Provides shared OpenAI API integration and utilities for all AI services.
 * Uses GPT-4o-mini for fast, cost-effective extraction.
 * 
 * @see docs/specs/OPERATIONAL_OVERHAUL.MD - Target: <3s extraction time
 */

// ============================================
// CONFIGURATION
// ============================================

/**
 * OpenAI Configuration
 * GPT-4o-mini is optimized for fast responses (~1-2s)
 * 
 * In production on AWS, OPENAI_API_KEY is loaded from AWS Secrets Manager
 * via the startup script: scripts/start-app-with-secrets.sh
 * Secret name: tms/integrations/openai/api-key
 */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

// ============================================
// TYPES
// ============================================

interface AICallOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  /** Override the default model */
  model?: string;
  /** Use JSON mode for structured output */
  jsonMode?: boolean;
}

export interface AICallResult<T = unknown> {
  data: T;
  finishReason?: string;
  wasTruncated: boolean;
  tokensUsed?: number;
  latencyMs?: number;
}

// ============================================
// SERVICE CLASS
// ============================================

export class AIService {
  protected apiKey: string;
  protected apiUrl: string;
  protected defaultModel: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.apiUrl = OPENAI_API_URL;
    this.defaultModel = DEFAULT_MODEL;

    if (!this.apiKey) {
      console.warn('[AIService] OPENAI_API_KEY not set. AI features will fail.');
    }
  }

  /**
   * Make a call to OpenAI API
   * Uses GPT-4o-mini for fast, cost-effective responses
   */
  protected async callAI<T = unknown>(
    userPrompt: string,
    options: AICallOptions = {}
  ): Promise<AICallResult<T>> {
    const startTime = Date.now();
    const {
      temperature = 0.1,
      maxTokens = 4000,
      systemPrompt = 'You are a helpful AI assistant. Return ONLY valid JSON, no markdown, no code blocks.',
      stream = false,
      model = this.defaultModel,
      jsonMode = true,
    } = options;

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    try {
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream,
      };

      // Enable JSON mode for structured output
      if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[AIService] OpenAI API error:', error);
        throw new Error(`AI processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const finishReason = data.choices?.[0]?.finish_reason;
      const wasTruncated = finishReason === 'length';
      const tokensUsed = data.usage?.total_tokens;
      const latencyMs = Date.now() - startTime;

      // Log performance
      console.log(`[AIService] ${model} response in ${latencyMs}ms, ${tokensUsed} tokens`);

      // Parse JSON response
      const parsed = this.parseJsonResponse<T>(content);

      return {
        data: parsed,
        finishReason,
        wasTruncated,
        tokensUsed,
        latencyMs,
      };
    } catch (error) {
      console.error('[AIService] Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during AI call');
    }
  }

  /**
   * Make a streaming call to OpenAI API
   */
  protected async callAIStream(
    userPrompt: string,
    options: AICallOptions = {}
  ): Promise<ReadableStream> {
    const {
      temperature = 0.5,
      maxTokens = 4000,
      systemPrompt = 'You are a helpful AI assistant.',
      model = this.defaultModel,
    } = options;

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.statusText}`);
      }

      return response.body as ReadableStream;
    } catch (error) {
      console.error('[AIService] Streaming Error:', error);
      throw error;
    }
  }


  /**
   * Parse JSON response, handling markdown code blocks
   */
  private parseJsonResponse<T>(content: string): T {
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

    try {
      return JSON.parse(jsonText) as T;
    } catch {
      // Try to fix incomplete JSON
      const fixedJson = this.fixIncompleteJSON(jsonText);
      try {
        return JSON.parse(fixedJson) as T;
      } catch (finalError) {
        // Fallback: If T is string, return text. If generic, return text as "response" or raw?
        // Safe fallback: Return the raw text if expected type allows, otherwise specific object?
        // For general usage, returning raw text is better than crashing.
        console.warn('[AIService] JSON parse failed, returning raw text');
        return content as unknown as T;
      }
    }
  }

  /**
   * Fix incomplete JSON by closing open structures
   */
  protected fixIncompleteJSON(text: string): string {
    let fixed = text.trim();

    // Remove trailing commas before closing brackets/braces
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Count open/close braces and brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    // If JSON appears incomplete, close it
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // Find the last complete value before the truncation
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
            const nextChar = fixed.substring(i + 1).trim()[0];
            if (nextChar === '{' || nextChar === '[') {
              lastValidIndex = i;
            }
          }
        }
      }

      if (lastValidIndex > 0) {
        fixed = fixed.substring(0, lastValidIndex + 1);
      }

      // Close any remaining open structures
      const bracesToClose = openBraces - closeBraces;
      const bracketsToClose = openBrackets - closeBrackets;

      fixed += ']'.repeat(Math.max(0, bracketsToClose));
      fixed += '}'.repeat(Math.max(0, bracesToClose));
    }

    return fixed;
  }

  /**
   * Extract text from PDF buffer using pdf-parse
   */
  protected async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);

      let text = data.text;

      // Optimize: Remove excessive whitespace and normalize line breaks
      text = text
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      // Limit text length for efficiency
      if (text.length > 25000) {
        text = text.substring(0, 25000);
      }

      return text;
    } catch (error) {
      console.error('[AIService] PDF parsing error:', error);
      throw new Error('Failed to parse PDF. Please ensure the file is a valid PDF.');
    }
  }

  /**
   * Truncate text to fit within token limits
   */
  protected truncateText(text: string, maxChars: number = 8000): string {
    if (text.length <= maxChars) {
      return text;
    }
    return text.substring(0, maxChars);
  }
}
