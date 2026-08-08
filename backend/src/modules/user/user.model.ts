import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Role hierarchy (highest → lowest privilege):
 *  - super_admin:   platform operator. Not tied to a company. Manages tenants.
 *  - company_admin:  owns a tenant. Full control within that company only.
 *  - team_lead:      manages a team's projects/tasks/attendance within the company.
 *  - employee:       standard user scoped to their own work + assigned items.
 */
export const ROLES = ['super_admin', 'company_admin', 'team_lead', 'employee'] as const;
export type Role = (typeof ROLES)[number];

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  companyId: Types.ObjectId | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'employee',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
      // Enforced in application logic rather than a schema-level conditional
      // required, since super_admin legitimately has no company.
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Tokens are stored as SHA-256 hashes (see utils/token.ts) — the raw
    // value only ever exists in the email link, never in the database.
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ companyId: 1, role: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(
  this: IUser,
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).password;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).emailVerificationToken;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).emailVerificationExpires;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).passwordResetToken;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (ret as unknown as Record<string, unknown>).passwordResetExpires;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
