import { body, param, query } from 'express-validator';

export const channelIdValidation = [
  param('channelId').trim().isLength({ min: 1, max: 60 }).withMessage('Invalid channel id'),
];

export const sendMessageValidation = [
  ...channelIdValidation,
  body('text').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  body('attachment.fileId').optional().isMongoId(),
  body('attachment.fileName').optional().isString(),
  body('attachment.mimeType').optional().isString(),
  body('attachment.size').optional().isInt({ min: 0 }),
  body().custom((value) => {
    if (!value.text?.trim() && !value.attachment) {
      throw new Error('A message needs text, a file, or both');
    }
    return true;
  }),
];

export const listMessagesValidation = [
  ...channelIdValidation,
  query('before').optional().isISO8601().withMessage('before must be a valid date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
