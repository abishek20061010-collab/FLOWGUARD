import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * File filter that rejects non-image uploads with a descriptive error.
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    (err as Error & { message: string }).message =
      `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are accepted.`;
    cb(err as unknown as null, false);
  }
}

/**
 * Multer instance using in-memory storage.
 * Accepts a single file with field name 'photo', max 5 MB.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single('photo');

/**
 * Multer instance for resolution photos (used in admin report resolution).
 * Accepts a single file with field name 'resolution_photo', max 5 MB.
 */
export const uploadResolutionMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single('resolution_photo');
