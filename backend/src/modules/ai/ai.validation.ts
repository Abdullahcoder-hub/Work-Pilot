import { body } from 'express-validator';

export const chatValidation = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
  body('attachedFileId').optional().isMongoId().withMessage('attachedFileId must be a valid id'),
];
