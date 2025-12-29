/**
 * Excel Import Utilities
 * Uses xlsx package for Excel file parsing
 */

import * as XLSX from 'xlsx';

interface ExcelImportOptions {
  sheetIndex?: number; // Which sheet to import (0-based)
  sheetName?: string; // Or specify sheet name
  skipFirstRow?: boolean;
  maxRows?: number;
  validateRow?: (row: any, index: number) => { valid: boolean; errors?: string[] };
}

export interface ExcelImportResult<T = any> {
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
 * Convert Excel file to JSON array (Server-side version - uses buffer)
 */
export async function excelFileToJSON(
  file: File | Blob | Buffer | ArrayBuffer | Uint8Array,
  options: ExcelImportOptions = {}
): Promise<ExcelImportResult> {
  const { sheetIndex = 0, sheetName, skipFirstRow = true, maxRows, validateRow } = options;

  try {
    // Handle various input types (File, Blob, Buffer, ArrayBuffer, Uint8Array)
    let buffer: Buffer;
    
    // Check if it's already a Buffer
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof ArrayBuffer) {
      // ArrayBuffer - convert directly to Buffer
      buffer = Buffer.from(file);
    } else if (file instanceof Uint8Array) {
      // Uint8Array - convert to Buffer
      buffer = Buffer.from(file);
    } else if (file && typeof (file as any).arrayBuffer === 'function') {
      // File or Blob object - convert to buffer using arrayBuffer() method
      // This works in both browser and server environments
      try {
        const arrayBuffer = await (file as File | Blob).arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (error) {
        throw new Error(`Failed to read file as ArrayBuffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      throw new Error(`Invalid file type. Expected File, Blob, Buffer, ArrayBuffer, or Uint8Array. Got: ${typeof file}`);
    }
    
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get sheet
    let sheet;
    if (sheetName) {
      sheet = workbook.Sheets[sheetName];
    } else {
      const sheetNames = workbook.SheetNames;
      if (sheetIndex >= sheetNames.length) {
        return {
          success: false,
          data: [],
          errors: [{ row: 0, data: {}, errors: [`Sheet index ${sheetIndex} not found. Available sheets: ${sheetNames.join(', ')}`] }],
          summary: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            skippedRows: 0,
          },
        };
      }
      sheet = workbook.Sheets[sheetNames[sheetIndex]];
    }
    
    if (!sheet) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, data: {}, errors: ['Sheet not found'] }],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          skippedRows: 0,
        },
      };
    }
    
    // Convert sheet to JSON - use first row as headers (default behavior)
    // XLSX.utils.sheet_to_json automatically uses first row as headers
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      raw: false,
      defval: '',
    }) as any[];
    
    if (jsonData.length === 0) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, data: {}, errors: ['Excel file is empty'] }],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          skippedRows: 0,
        },
      };
    }
    
    // Process data
    const data: any[] = [];
    const errors: Array<{ row: number; data: any; errors: string[] }> = [];
    
    let validRows = 0;
    let invalidRows = 0;
    let skippedRows = 0;
    
    // Normalize keys to lowercase with underscores
    const normalizeKey = (key: string) => String(key || '').trim().toLowerCase().replace(/\s+/g, '_');
    
    // Process data rows (first row is already used as headers by XLSX, so all rows are data)
    for (let i = 0; i < jsonData.length; i++) {
      if (maxRows && i >= maxRows) {
        skippedRows += jsonData.length - i;
        break;
      }
      
      const rawRow = jsonData[i] as any;
      if (!rawRow || Object.keys(rawRow).length === 0) {
        skippedRows++;
        continue;
      }
      
      // Normalize row keys and values
      const rowData: any = {};
      Object.keys(rawRow).forEach((key) => {
        const normalizedKey = normalizeKey(key);
        const value = rawRow[key];
        // Include all values, even empty ones, but convert to string
        if (value !== undefined && value !== null) {
          rowData[normalizedKey] = value === '' ? '' : String(value).trim();
        }
      });
      
      // Skip if row is completely empty after processing
      const hasValues = Object.values(rowData).some(val => val !== '' && val !== null && val !== undefined);
      if (!hasValues) {
        skippedRows++;
        continue;
      }
      
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
        totalRows: jsonData.length,
        validRows,
        invalidRows,
        skippedRows,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, data: {}, errors: [error.message || 'Failed to parse Excel file'] }],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
      },
    };
  }
}

