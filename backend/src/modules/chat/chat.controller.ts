import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import * as chatService from './chat.service';
import * as fileService from '../files/file.service';

function requireActor(req: Request) {
  if (!req.user || !req.user.companyId) throw ApiError.forbidden();
  return { userId: req.user.userId, role: req.user.role, companyId: req.user.companyId };
}

export const listDmThreads = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const threads = await chatService.listDmThreads(actor);
  res.status(200).json({ success: true, data: threads });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);
  const { before, limit } = req.query;
  const messages = await chatService.listMessages(actor, req.params.channelId, {
    before: before as string | undefined,
    limit: limit as unknown as number | undefined,
  });
  res.status(200).json({ success: true, data: messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const actor = requireActor(req);

  let attachment;
  if (req.body.attachment?.fileId) {
    const file = await fileService.getFile(actor, req.body.attachment.fileId);
    attachment = { fileId: file._id.toString(), fileName: file.fileName, mimeType: file.mimeType, size: file.size };
  }

  const message = await chatService.sendMessage(actor, req.params.channelId, req.body.text ?? '', attachment);
  res.status(201).json({ success: true, data: message });
});
