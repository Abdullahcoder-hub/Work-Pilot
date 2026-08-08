"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.ROLES = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Role hierarchy (highest → lowest privilege):
 *  - super_admin:   platform operator. Not tied to a company. Manages tenants.
 *  - company_admin:  owns a tenant. Full control within that company only.
 *  - team_lead:      manages a team's projects/tasks/attendance within the company.
 *  - employee:       standard user scoped to their own work + assigned items.
 */
exports.ROLES = ['super_admin', 'company_admin', 'team_lead', 'employee'];
const userSchema = new mongoose_1.Schema({
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
        enum: exports.ROLES,
        default: 'employee',
        required: true,
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
userSchema.index({ companyId: 1, role: 1 });
userSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(12);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function comparePassword(candidate) {
    return bcryptjs_1.default.compare(candidate, this.password);
};
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
    },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
