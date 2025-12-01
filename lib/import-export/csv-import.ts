/**
 * CSV Import Utilities
 * Handles parsing and validating CSV files for bulk imports
 */

interface CSVImportOptions {
  skipFirstRow?: boolean; // Skip header row
  maxRows?: number; // Maximum number of rows to process
  validateRow?: (row: any, index: number) => { valid: boolean; errors?: string[] };
}

export interface CSVImportResult<T = any> {
  success: boolean;
  data: T[];
  errors: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
}

/**
 * Parse CSV file content into array of objects
 */
export function parseCSV(
  csvContent: string,
  options: CSVImportOptions = {}
): CSVImportResult {
  const { skipFirstRow = true, maxRows, validateRow } = options;
  const lines = csvContent.split('\n').filter((line) => line.trim());
  
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, data: {}, errors: ['CSV file is empty'] }],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
      },
    };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const startIndex = skipFirstRow ? 1 : 0;
  const data: any[] = [];
  const errors: Array<{ row: number; data: any; errors: string[] }> = [];
  
  let validRows = 0;
  let invalidRows = 0;
  let skippedRows = skipFirstRow ? 1 : 0;

  // Process data rows
  for (let i = startIndex; i < lines.length; i++) {
    if (maxRows && i - startIndex >= maxRows) {
      skippedRows += lines.length - i;
      break;
    }

    const line = lines[i].trim();
    if (!line) {
      skippedRows++;
      continue;
    }

    const values = parseCSVLine(line);
    const rowData: any = {};

    // Map values to headers
    headers.forEach((header, index) => {
      const cleanHeader = header.trim().toLowerCase().replace(/\s+/g, '_');
      rowData[cleanHeader] = values[index]?.trim() || '';
    });

    // Validate row if validator provided
    if (validateRow) {
      const validation = validateRow(rowData, i);
      if (!validation.valid) {
        invalidRows++;
        errors.push({
          row: i + 1,
          data: rowData,
          errors: validation.errors || ['Row validation failed'],
        });
        continue;
      }
    }

    validRows++;
    data.push(rowData);
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    summary: {
      totalRows: lines.length - (skipFirstRow ? 1 : 0),
      validRows,
      invalidRows,
      skippedRows,
    },
  };
}

/**
 * Parse a single CSV line handling quoted fields and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Convert CSV file to JSON array (Server-side version - uses buffer/text)
 */
export async function csvFileToJSON(file: File | Buffer | string): Promise<CSVImportResult> {
  try {
    let content: string;
    
    if (typeof file === 'string') {
      // Already a string
      content = file;
    } else if (Buffer.isBuffer(file)) {
      // Buffer - convert to string
      content = file.toString('utf-8');
    } else if (file && typeof (file as any).text === 'function') {
      // File or Blob object - convert to text (works in both browser and server)
      content = await (file as File | Blob).text();
    } else if (file && typeof (file as any).arrayBuffer === 'function') {
      // Fallback: use arrayBuffer and convert to string
      const arrayBuffer = await (file as File | Blob).arrayBuffer();
      content = Buffer.from(arrayBuffer).toString('utf-8');
    } else {
      throw new Error('Invalid file type. Expected File, Blob, Buffer, or string.');
    }
    
    const result = parseCSV(content);
    return result;
  } catch (error: any) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, data: {}, errors: [error.message || 'Failed to read CSV file'] }],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
      },
    };
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (US format)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-()]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 11;
}

/**
 * Validate date format
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Convert string to number, handling empty strings and invalid values
 */
function parseNumber(value: string, defaultValue: number = 0): number {
  if (!value || value.trim() === '') return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Convert string to boolean
 */
function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'y'].includes(normalized);
}

