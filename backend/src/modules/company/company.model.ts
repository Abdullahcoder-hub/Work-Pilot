import { Schema, model, Document, Types } from 'mongoose';

export type CompanyPlan = 'free' | 'pro' | 'enterprise';
export type CompanyStatus = 'active' | 'suspended';

export interface ICompany extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  plan: CompanyPlan;
  status: CompanyStatus;
  seatLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    seatLimit: {
      type: Number,
      default: 10,
      min: 1,
    },
  },
  { timestamps: true }
);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const Company = model<ICompany>('Company', companySchema);
