import {
  validateFile,
  validateFiles,
  sanitizeFilename,
  generateUniqueFilename,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from './fileValidation';

// Mock File constructor for testing
class MockFile implements File {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  webkitRelativePath: string = '';

  constructor(content: BlobPart[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.type = options?.type || '';
    this.size = this.calculateSize(content);
    this.lastModified = options?.lastModified || Date.now();
  }

  private calculateSize(content: BlobPart[]): number {
    return content.reduce((total, part) => {
      if (typeof part === 'string') return total + part.length;
      if (part instanceof ArrayBuffer) return total + part.byteLength;
      if (ArrayBuffer.isView(part)) return total + part.byteLength;
      return total;
    }, 0);
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([], { type: contentType });
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async text(): Promise<string> {
    return '';
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    const buffer = await this.arrayBuffer();
    return new Uint8Array(buffer);
  }

  stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    return new ReadableStream();
  }
}

describe('fileValidation', () => {
  describe('validateFile', () => {
    it('should validate a valid image file', async () => {
      const file = new MockFile(['test content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await validateFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
        maxSize: MAX_FILE_SIZES.image,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test.jpg');
        expect(result.data.type).toBe('image/jpeg');
        expect(result.data.extension).toBe('jpg');
      }
    });

    it('should reject file with invalid type', async () => {
      const file = new MockFile(['test content'], 'test.exe', {
        type: 'application/x-msdownload',
      });

      const result = await validateFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_FILE_TYPE');
      }
    });

    it('should reject file that is too large', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11 MB
      const file = new MockFile([largeContent], 'large.jpg', {
        type: 'image/jpeg',
      });

      const result = await validateFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
        maxSize: MAX_FILE_SIZES.image, // 10 MB
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_TOO_LARGE');
      }
    });

    it('should reject empty file', async () => {
      const file = new MockFile([], 'empty.jpg', {
        type: 'image/jpeg',
      });

      const result = await validateFile(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_FILE');
      }
    });

    it('should reject file without extension', async () => {
      const file = new MockFile(['content'], 'noextension', {
        type: 'image/jpeg',
      });

      const result = await validateFile(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_FILE_EXTENSION');
      }
    });

    it('should reject file with mismatched extension', async () => {
      const file = new MockFile(['content'], 'test.png', {
        type: 'image/jpeg',
      });

      const result = await validateFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTENSION_MISMATCH');
      }
    });

    it('should validate PDF document', async () => {
      const file = new MockFile(['PDF content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const result = await validateFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.documents],
        maxSize: MAX_FILE_SIZES.document,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.extension).toBe('pdf');
      }
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple valid files', async () => {
      const files = [
        new MockFile(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new MockFile(['content2'], 'file2.png', { type: 'image/png' }),
      ];

      const result = await validateFiles(files, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should return errors for invalid files', async () => {
      const files = [
        new MockFile(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new MockFile(['content2'], 'file2.exe', { type: 'application/x-msdownload' }),
      ];

      const result = await validateFiles(files, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERRORS');
        expect(result.error.details).toBeDefined();
      }
    });

    it('should reject empty file array', async () => {
      const result = await validateFiles([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NO_FILES');
      }
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('_.._.._etc_passwd');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFilename('file\0name.jpg')).toBe('file_name.jpg');
    });

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden.txt')).toBe('hidden.txt');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.jpg')).toBe(true);
    });

    it('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename('   ')).toBe('file');
    });

    it('should preserve valid filenames', () => {
      expect(sanitizeFilename('valid-file_name.jpg')).toBe('valid-file_name.jpg');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with timestamp', () => {
      const original = 'test.jpg';
      const unique = generateUniqueFilename(original);

      expect(unique).toContain('test_');
      expect(unique).toMatch(/test_\d+_[a-z0-9]+\.jpg/);
    });

    it('should sanitize filename before generating unique name', () => {
      const original = '../../../test.jpg';
      const unique = generateUniqueFilename(original);

      expect(unique).not.toContain('../');
      expect(unique).toMatch(/_\d+_[a-z0-9]+\.jpg$/);
    });

    it('should preserve file extension', () => {
      const original = 'document.pdf';
      const unique = generateUniqueFilename(original);

      expect(unique).toMatch(/\.pdf$/);
    });

    it('should generate different names for same input', () => {
      const original = 'test.jpg';
      const unique1 = generateUniqueFilename(original);
      const unique2 = generateUniqueFilename(original);

      expect(unique1).not.toBe(unique2);
    });
  });
});
