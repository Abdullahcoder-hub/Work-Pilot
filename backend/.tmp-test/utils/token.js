"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRawToken = generateRawToken;
exports.hashToken = hashToken;
const crypto_1 = __importDefault(require("crypto"));
/** Generates a random token and its SHA-256 hash — same pattern used for
 * email verification, invite acceptance, and password reset tokens so a
 * leaked database never exposes usable links. */
function generateRawToken() {
    const raw = crypto_1.default.randomBytes(32).toString('hex');
    const hashed = crypto_1.default.createHash('sha256').update(raw).digest('hex');
    return { raw, hashed };
}
function hashToken(raw) {
    return crypto_1.default.createHash('sha256').update(raw).digest('hex');
}
