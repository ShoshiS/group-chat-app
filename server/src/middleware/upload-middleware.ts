import type { NextFunction, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer, { type FileFilterCallback } from 'multer';
import { CloudinaryStorage, type Options as CloudinaryStorageOptions } from 'multer-storage-cloudinary';

import { env } from '../config/env.js';
import type { IAttachment } from '../models/message-model.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

if (!env.cloudinary.apiSecret) {
  console.warn('CLOUDINARY_API_SECRET is empty — file uploads will fail until .env is configured');
}

// cloudinary's UploadApiOptions has `[futureKey: string]: any` which makes
// KnownKeys<> resolve to never in multer-storage-cloudinary's types; the cast bypasses that.
const CLOUDINARY_PARAMS = {
  folder: 'chat-attachments',
  resource_type: 'auto',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'pdf'],
} as unknown as CloudinaryStorageOptions['params'];

const storage = new CloudinaryStorage({ cloudinary, params: CLOUDINARY_PARAMS });

const ALLOWED_MIME = /^(image\/.+|audio\/.+|application\/pdf)$/;

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    const err = Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), { status: 400 });
    cb(err as unknown as null, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxFileSizeBytes },
});

/**
 * Multer middleware that uploads up to 10 files to Cloudinary under the
 * `files` form-data field. Rejects non-image/audio/pdf types (400) and
 * files exceeding 10 MB (400). Cloudinary errors propagate via next(err).
 */
export const uploadMessageFiles = upload.array('files', 10);

/** Maps Multer/Cloudinary files to IAttachment records stored in the DB. */
export function filesToAttachments(files: Express.Multer.File[]): IAttachment[] {
  return files.map((file) => {
    let type: IAttachment['type'];
    if (file.mimetype.startsWith('image/')) {
      type = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      type = 'audio';
    } else {
      type = 'pdf';
    }
    // multer-storage-cloudinary stores the Cloudinary secure_url in file.path
  // #region agent log
  if (type === 'pdf') {
    fetch('http://127.0.0.1:7436/ingest/d8a133c7-0636-453c-a4ac-ce2726dc7d38', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '947029' },
      body: JSON.stringify({
        sessionId: '947029',
        location: 'upload-middleware.ts:filesToAttachments',
        message: 'PDF uploaded to Cloudinary',
        data: {
          mimetype: file.mimetype,
          path: file.path,
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
        },
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {});
  }
  // #endregion
    return { type, url: file.path, originalName: file.originalname };
  });
}

/**
 * Merges uploaded Cloudinary files into req.body.attachments so the
 * downstream Joi validator sees a complete message body.
 */
export function mergeFileAttachments(req: Request, _res: Response, next: NextFunction): void {
  const files = req.files;
  if (Array.isArray(files) && files.length > 0) {
    const fromFiles = filesToAttachments(files);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const existing: IAttachment[] = Array.isArray(body.attachments) ? body.attachments : [];
    req.body = { ...body, attachments: [...existing, ...fromFiles] };
  }
  next();
}
