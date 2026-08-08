"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
exports.slugify = slugify;
const mongoose_1 = require("mongoose");
const companySchema = new mongoose_1.Schema({
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
}, { timestamps: true });
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}
exports.Company = (0, mongoose_1.model)('Company', companySchema);
