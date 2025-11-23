/**
 * Base AI Service
 * Provides shared DeepSeek API integration and utilities for all AI services
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-be6d955aafb84e25bfb9c18ef425ca31';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface AICallOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface AICallResult<T = any> {
  data: T;
  finishReason?: string;
  wasTruncated: boolean;
  tokensUsed?: number;
}

export class AIService {
  protected apiKey: string;
  protected apiUrl: string;

  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.apiUrl = DEEPSEEK_API_URL;
  }

  /**
   * Make a call to DeepSeek API
   */
  protected async callAI<T = any>(
    userPrompt: string,
    options: AICallOptions = {}
  ): Promise<AICallResult<T>> {
    const {
      temperature = 0.1,
      maxTokens = 5000,
      systemPrompt = 'You are a helpful AI assistant. Return ONLY valid JSON, no markdown, no code blocks.',
      stream = false,
    } = options;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
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
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('DeepSeek API error:', error);
        throw new Error(`AI processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const finishReason = data.choices?.[0]?.finish_reason;
      const wasTruncated = finishReason === 'length';
      const tokensUsed = data.usage?.total_tokens;

      // Clean the response - remove markdown code blocks if present
      let jsonText = content.trim();
      
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

      // Parse JSON
      try {
        const parsed = JSON.parse(jsonText);
        return {
          data: parsed as T,
          finishReason,
          wasTruncated,
          tokensUsed,
        };
      } catch (parseError) {
        // Try to fix incomplete JSON
        const fixedJson = this.fixIncompleteJSON(jsonText);
        const parsed = JSON.parse(fixedJson);
        return {
          data: parsed as T,
          finishReason,
          wasTruncated: true, // Mark as truncated since we had to fix it
          tokensUsed,
        };
      }
    } catch (error) {
      console.error('AI call error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during AI call');
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
    
    // If JSON appears incomplete, try to close it
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
      
      fixed += '\n' + ']'.repeat(bracketsToClose);
      fixed += '\n' + '}'.repeat(bracesToClose);
    }
    
    return fixed;
  }

  /**
   * Extract text from PDF buffer
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
      console.error('PDF parsing error:', error);
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

