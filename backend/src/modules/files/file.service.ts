import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { FileRecord } from './file.model';
import { ApiError } from '../../utils/ApiError';

export const UPLOADS_ROOT = path.resolve(__dirname, '../../../uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — plenty for a chat/library attachment, not a media host

/**
 * Executable/script extensions are blocked outright — this is a document
 * and chat attachment store, not a place to host something someone could
 * later be tricked into running. Everything else (documents, images,
 * archives, media, code-as-text) is allowed.
 */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.msp', '.scr', '.sh', '.bash',
  '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.dll',
  '.app', '.jar', '.apk', '.deb', '.rpm', '.dmg', '.gadget', '.cpl',
]);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      cb(new Error('Not authenticated'), '');
      return;
    }
    const dir = path.join(UPLOADS_ROOT, companyId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Random on-disk name — the original filename is preserved in Mongo
    // and only re-attached as a download header, never used as a path.
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${path.extname(file.originalname)}`);
  },
});

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    cb(new Error(`Files of type "${ext}" aren't allowed for security reasons.`));
    return;
  }
  cb(null, true);
}

export const uploadMiddleware = multer({ storage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter }).single('file');

interface Actor {
  userId: string;
  role: string;
  companyId: string;
}

const CAN_MANAGE_ALL_FILES = ['company_admin', 'team_lead'];

export async function saveFileRecord(actor: Actor, file: Express.Multer.File) {
  return FileRecord.create({
    companyId: actor.companyId,
    uploadedBy: actor.userId,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storagePath: path.relative(UPLOADS_ROOT, file.path),
  });
}

export async function getFile(actor: Actor, fileId: string) {
  const file = await FileRecord.findOne({ _id: fileId, companyId: actor.companyId });
  if (!file) throw ApiError.notFound('File not found');
  return file;
}

interface ListFilesInput {
  search?: string;
  page?: number;
  limit?: number;
}

export async function listFiles(actor: Actor, filters: ListFilesInput) {
  const query: Record<string, unknown> = { companyId: actor.companyId };
  if (filters.search) {
    query.fileName = { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 40;

  const [files, total] = await Promise.all([
    FileRecord.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('uploadedBy', 'name')
      .lean(),
    FileRecord.countDocuments(query),
  ]);

  return { files, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function deleteFile(actor: Actor, fileId: string) {
  const file = await FileRecord.findOne({ _id: fileId, companyId: actor.companyId });
  if (!file) throw ApiError.notFound('File not found');

  const isOwner = file.uploadedBy.toString() === actor.userId;
  if (!isOwner && !CAN_MANAGE_ALL_FILES.includes(actor.role)) {
    throw ApiError.forbidden('Only the person who uploaded this file, or a team lead/admin, can delete it');
  }

  const onDisk = absolutePath(file);
  await file.deleteOne();
  // Best-effort disk cleanup — a stray orphaned file is a minor cost,
  // failing the delete request over it is a worse tradeoff.
  fs.unlink(onDisk, () => {});
}

export function absolutePath(file: { storagePath: string }): string {
  return path.join(UPLOADS_ROOT, file.storagePath);
}
