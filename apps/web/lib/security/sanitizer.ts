import DOMPurify from 'isomorphic-dompurify';

// DOMPurify configuration
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [], // No HTML tags allowed by default
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// Sanitize string input (removes HTML, scripts)
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, DOMPURIFY_CONFIG).trim();
}

// Sanitize HTML (allow safe tags for rich text)
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b)/i,
  /(--)|(\/\*)|(\*\/)/,
  /(;|\|)/,
  /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  /(\bAND\b\s+\d+\s*=\s*\d+)/i,
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$lt/i,
  /\$ne/i,
  /\$regex/i,
  /\$or/i,
  /\$and/i,
];

// Check for SQL injection
export function hasSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// Check for NoSQL injection
export function hasNoSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  return NOSQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null;
  const sanitized = sanitizeString(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : null;
}

// Validate and sanitize numeric string
export function sanitizeNumeric(input: string, options?: {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
}): number | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;

  const numStr = String(input).trim();
  const regex = options?.allowDecimal ? /^-?\d+\.?\d*$/ : /^-?\d+$/;

  if (!regex.test(numStr)) return null;

  const num = options?.allowDecimal ? parseFloat(numStr) : parseInt(numStr, 10);

  if (isNaN(num)) return null;
  if (options?.min !== undefined && num < options.min) return null;
  if (options?.max !== undefined && num > options.max) return null;

  return num;
}

// Validate file extension
export function isValidFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  if (typeof filename !== 'string') return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

// Validate file size (in bytes)
export function isValidFileSize(size: number, maxSize: number): boolean {
  return typeof size === 'number' && size > 0 && size <= maxSize;
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  // Remove path traversal and special characters
  return filename
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\.{2,}/g, '.')
    .trim();
}

// Validate date string
export function isValidDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Escape special characters for safe display
export function escapeForDisplay(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
