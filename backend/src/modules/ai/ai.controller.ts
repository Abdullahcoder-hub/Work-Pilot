import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as aiService from './ai.service';
import * as fileService from '../files/file.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const history = await aiService.getHistory(actor);
  res.status(200).json({ success: true, data: history });
});

export const clearHistory = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  await aiService.clearHistory(actor);
  res.status(200).json({ success: true, message: 'Conversation cleared' });
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);

  let attachedFile;
  if (req.body.attachedFileId) {
    const file = await fileService.getFile(actor, req.body.attachedFileId);
    attachedFile = { fileId: file._id.toString(), fileName: file.fileName, mimeType: file.mimeType, size: file.size };
  }

  const result = await aiService.chat(actor, req.body.message, attachedFile);
  res.status(200).json({ success: true, data: result });
});
