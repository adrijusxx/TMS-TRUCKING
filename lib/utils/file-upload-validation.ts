/**
 * File Upload Validation Utilities
 * Provides secure file upload validation including:
 * - File type validation
 * - File size limits
 * - MIME type checking
 * - File extension validation
 * - Filename sanitization
 */

// Allowed file types by category
const documents = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

const images = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

const ALLOWED_FILE_TYPES = {
  documents,
  images,
  all: [
    ...documents,
    ...images,
  ],
} as const;

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
] as const;

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  document: 10 * 1024 * 1024, // 10 MB for documents
  image: 5 * 1024 * 1024, // 5 MB for images
  default: 10 * 1024 * 1024, // 10 MB default
} as const;

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.app',
  '.deb',
  '.pkg',
  '.rpm',
  '.sh',
  '.msi',
  '.dll',
  '.sys',
] as const;

interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFileName?: string;
  detectedType?: 'document' | 'image';
}

/**
 * Validate file type by MIME type
 */
function validateMimeType(
  mimeType: string,
  allowedTypes: string[] | readonly string[] = ALLOWED_FILE_TYPES.all
): boolean {
  if (!mimeType) {
    return false;
  }

  // Check exact match
  if (allowedTypes.includes(mimeType)) {
    return true;
  }

  // Check image/* or application/* patterns
  if (mimeType.startsWith('image/') && allowedTypes.some((type) => type.startsWith('image/'))) {
    return true;
  }

  if (mimeType.startsWith('application/pdf') && allowedTypes.includes('application/pdf')) {
    return true;
  }

  return false;
}

/**
 * Validate file extension
 */
function validateFileExtension(fileName: string): boolean {
  if (!fileName) {
    return false;
  }

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.some((ext) => extension === ext.toLowerCase())) {
    return false;
  }

  // Check for allowed extensions
  return ALLOWED_EXTENSIONS.some((ext) => extension === ext.toLowerCase());
}

/**
 * Validate file size
 */
function validateFileSize(
  fileSize: number,
  maxSize: number = FILE_SIZE_LIMITS.default
): boolean {
  return fileSize > 0 && fileSize <= maxSize;
}

/**
 * Sanitize filename to prevent directory traversal and other security issues
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) {
    return 'file';
  }

  // Remove directory separators and path components
  let sanitized = fileName.replace(/[/\\?%*:|"<>]/g, '_');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^\.+|\.+$/g, '').trim();

  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - extension.length) + extension;
  }

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Detect file category from MIME type
 */
function detectFileCategory(mimeType: string): 'document' | 'image' | 'unknown' {
  if (!mimeType) {
    return 'unknown';
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (
    mimeType.startsWith('application/') ||
    mimeType.startsWith('text/')
  ) {
    return 'document';
  }

  return 'unknown';
}

/**
 * Comprehensive file validation
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[] | readonly string[];
    allowedExtensions?: string[] | readonly string[];
    requireExtension?: boolean;
  } = {}
): FileValidationResult {
  const {
    maxSize = FILE_SIZE_LIMITS.default,
    allowedTypes = ALLOWED_FILE_TYPES.all,
    allowedExtensions = ALLOWED_EXTENSIONS,
    requireExtension = true,
  } = options;

  // Validate file size
  if (!validateFileSize(file.size, maxSize)) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB} MB`,
    };
  }

  // Validate file extension
  if (requireExtension && !validateFileExtension(file.name)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    };
  }

  // Validate MIME type
  if (file.type && !validateMimeType(file.type, allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.type}" not allowed`,
    };
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name);

  // Detect file category
  const detectedType = detectFileCategory(file.type);

  return {
    valid: true,
    sanitizedFileName,
    detectedType: detectedType !== 'unknown' ? detectedType : undefined,
  };
}

/**
 * Get appropriate file size limit based on file type
 */
export function getFileSizeLimit(mimeType?: string): number {
  if (!mimeType) {
    return FILE_SIZE_LIMITS.default;
  }

  const category = detectFileCategory(mimeType);
  switch (category) {
    case 'image':
      return FILE_SIZE_LIMITS.image;
    case 'document':
      return FILE_SIZE_LIMITS.document;
    default:
      return FILE_SIZE_LIMITS.default;
  }
}

