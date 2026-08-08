import { Schema, model, Document, Types } from 'mongoose';

export interface IFile extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileName: string;
  mimeType: string;
  size: number;
  /** Path on disk, relative to backend/uploads/ — never exposed to clients directly. */
  storagePath: string;
  createdAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const FileRecord = model<IFile>('File', fileSchema);
