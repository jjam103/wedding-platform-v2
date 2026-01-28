/**
 * File validation utilities for secure file uploads
 */

/**
 * Result type for consistent error handling
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Allowed file types for different upload contexts
 */
export const ALLOWED_FILE_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  all: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
} as const;

/**
 * Maximum file sizes in bytes
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10 MB
  document: 25 * 1024 * 1024, // 25 MB
  default: 10 * 1024 * 1024, // 10 MB
} as const;

/**
 * File validation options
 */
export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  minSize?: number;
  checkMagicBytes?: boolean;
}

/**
 * Validated file information
 */
export interface ValidatedFile {
  name: string;
  type: string;
  size: number;
  extension: string;
  isValid: true;
}

/**
 * Magic bytes (file signatures) for common file types
 * Used to verify actual file type regardless of extension
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47], // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38], // GIF
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Validates a file based on type, size, and optionally magic bytes.
 * 
 * @param file - File object to validate
 * @param options - Validation options
 * @returns Result containing validated file info or error details
 * 
 * @example
 * const result = await validateFile(file, {
 *   allowedTypes: ALLOWED_FILE_TYPES.images,
 *   maxSize: MAX_FILE_SIZES.image,
 *   checkMagicBytes: true,
 * });
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<Result<ValidatedFile>> {
  try {
    const {
      allowedTypes = ALLOWED_FILE_TYPES.images,
      maxSize = MAX_FILE_SIZES.default,
      minSize = 0,
      checkMagicBytes = false,
    } = options;

    // 1. Validate file name
    if (!file.name || file.name.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_NAME',
          message: 'File name is required',
        },
      };
    }

    // 2. Validate file size
    if (file.size === 0) {
      return {
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'File is empty',
        },
      };
    }

    if (file.size < minSize) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_SMALL',
          message: `File size must be at least ${formatBytes(minSize)}`,
          details: { size: file.size, minSize },
        },
      };
    }

    if (file.size > maxSize) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum of ${formatBytes(maxSize)}`,
          details: { size: file.size, maxSize },
        },
      };
    }

    // 3. Validate file type
    if (!allowedTypes.includes(file.type as any)) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `File type ${file.type} is not allowed`,
          details: { type: file.type, allowedTypes },
        },
      };
    }

    // 4. Extract file extension
    const extension = getFileExtension(file.name);
    if (!extension) {
      return {
        success: false,
        error: {
          code: 'MISSING_FILE_EXTENSION',
          message: 'File must have an extension',
        },
      };
    }

    // 5. Validate file extension matches MIME type
    const expectedExtensions = getExpectedExtensions(file.type);
    if (expectedExtensions.length > 0 && !expectedExtensions.includes(extension.toLowerCase())) {
      return {
        success: false,
        error: {
          code: 'EXTENSION_MISMATCH',
          message: `File extension .${extension} does not match MIME type ${file.type}`,
          details: { extension, type: file.type, expectedExtensions },
        },
      };
    }

    // 6. Optionally check magic bytes (file signature)
    if (checkMagicBytes && MAGIC_BYTES[file.type]) {
      const isValidSignature = await validateMagicBytes(file, file.type);
      if (!isValidSignature) {
        return {
          success: false,
          error: {
            code: 'INVALID_FILE_SIGNATURE',
            message: 'File content does not match declared type',
            details: { type: file.type },
          },
        };
      }
    }

    return {
      success: true,
      data: {
        name: file.name,
        type: file.type,
        size: file.size,
        extension,
        isValid: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'File validation failed',
      },
    };
  }
}

/**
 * Validates multiple files in batch.
 * 
 * @param files - Array of files to validate
 * @param options - Validation options
 * @returns Result containing array of validated files or error details
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<Result<ValidatedFile[]>> {
  try {
    if (!files || files.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files provided',
        },
      };
    }

    const validatedFiles: ValidatedFile[] = [];
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of files) {
      const result = await validateFile(file, options);
      if (result.success) {
        validatedFiles.push(result.data);
      } else {
        errors.push({
          file: file.name,
          error: result.error.message,
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERRORS',
          message: `${errors.length} file(s) failed validation`,
          details: errors,
        },
      };
    }

    return {
      success: true,
      data: validatedFiles,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Batch validation failed',
      },
    };
  }
}

/**
 * Extracts file extension from filename.
 */
function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length < 2) return null;
  return parts[parts.length - 1];
}

/**
 * Gets expected file extensions for a MIME type.
 */
function getExpectedExtensions(mimeType: string): string[] {
  const extensionMap: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/heic': ['heic'],
    'image/heif': ['heif'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'text/csv': ['csv'],
  };

  return extensionMap[mimeType] || [];
}

/**
 * Validates file magic bytes (file signature).
 */
async function validateMagicBytes(file: File, mimeType: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // No signature to check

  try {
    // Read first 16 bytes of file
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check if any signature matches
    return signatures.some((signature) => {
      return signature.every((byte, index) => bytes[index] === byte);
    });
  } catch (error) {
    // If we can't read the file, fail validation
    return false;
  }
}

/**
 * Formats bytes into human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitizes filename to prevent path traversal and other attacks.
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[\/\\:\0]/g, '_');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 250) + (extension ? `.${extension}` : '');
  }

  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized.trim() === '') {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Generates a unique filename with timestamp and random suffix.
 * 
 * @param originalFilename - Original filename
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const extension = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `${nameWithoutExt}_${timestamp}_${random}${extension ? `.${extension}` : ''}`;
}
