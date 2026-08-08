import { Schema, model, Document, Types } from 'mongoose';

export interface IChatAttachment {
  fileId: Types.ObjectId;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  /** 'general' for the company-wide channel, or a Project's id for a project channel. */
  channelId: string;
  senderId: Types.ObjectId;
  text: string;
  attachment: IChatAttachment | null;
  createdAt: Date;
}

const chatAttachmentSchema = new Schema<IChatAttachment>(
  {
    fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const chatMessageSchema = new Schema<IChatMessage>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    channelId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Not required at the schema level — a file-only message (no caption)
    // is valid as long as `attachment` is set. chat.service.ts enforces
    // that at least one of the two is present.
    text: { type: String, trim: true, default: '', maxlength: 2000 },
    attachment: { type: chatAttachmentSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ companyId: 1, channelId: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
