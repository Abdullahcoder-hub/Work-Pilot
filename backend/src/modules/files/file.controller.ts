import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as fileService from './file.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  if (!req.file) throw ApiError.badRequest('No file was uploaded');

  const record = await fileService.saveFileRecord(actor, req.file);
  res.status(201).json({
    success: true,
    data: { fileId: record._id.toString(), fileName: record.fileName, mimeType: record.mimeType, size: record.size },
  });
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const file = await fileService.getFile(actor, req.params.id);
  res.download(fileService.absolutePath(file), file.fileName);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { search, page, limit } = req.query;
  const result = await fileService.listFiles(actor, {
    search: search as string | undefined,
    page: page as unknown as number | undefined,
    limit: limit as unknown as number | undefined,
  });
  res.status(200).json({ success: true, data: result.files, pagination: result.pagination });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await fileService.deleteFile(actor, req.params.id);
  res.status(200).json({ success: true, message: 'File deleted' });
});
