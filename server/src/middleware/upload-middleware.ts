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

const AVATAR_PARAMS = {
  folder: 'user-avatars',
  resource_type: 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
} as unknown as CloudinaryStorageOptions['params'];

const avatarStorage = new CloudinaryStorage({ cloudinary, params: AVATAR_PARAMS });

function avatarFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const err = Object.assign(new Error('Avatar must be an image'), { status: 400 });
    cb(err as unknown as null, false);
  }
}

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: env.upload.maxFileSizeBytes },
});

const GROUP_AVATAR_PARAMS = {
  folder: 'group-avatars',
  resource_type: 'image',
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
} as unknown as CloudinaryStorageOptions['params'];

const groupAvatarStorage = new CloudinaryStorage({ cloudinary, params: GROUP_AVATAR_PARAMS });

const groupAvatarUpload = multer({
  storage: groupAvatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: env.upload.maxFileSizeBytes },
});

/**
 * Multer middleware that uploads up to 10 files to Cloudinary under the
 * `files` form-data field. Rejects non-image/audio/pdf types (400) and
 * files exceeding 10 MB (400). Cloudinary errors propagate via next(err).
 */
export const uploadMessageFiles = upload.array('files', 10);

/** Uploads a single profile image under the `avatar` form-data field. */
export const uploadAvatar = avatarUpload.single('avatar');

/** Uploads a single group image under the `avatar` form-data field. */
export const uploadGroupAvatar = groupAvatarUpload.single('avatar');

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
    const existing: IAttachment[] = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    req.body = { ...req.body, attachments: [...existing, ...fromFiles] };
  }
  next();
}

/** Merges an uploaded avatar URL into req.body for downstream Joi validation. */
export function mergeAvatarIntoBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.file) {
    req.body = { ...req.body, avatar: req.file.path };
  }
  next();
}
