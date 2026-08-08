"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const auth_validation_1 = require("./auth.validation");
(0, node_test_1.default)('accepts strong passwords with the required complexity', () => {
    strict_1.default.match('Abcdef1!', auth_validation_1.PASSWORD_STRENGTH_REGEX);
    strict_1.default.match('Test123!@', auth_validation_1.PASSWORD_STRENGTH_REGEX);
});
(0, node_test_1.default)('rejects passwords that miss the required rules', () => {
    strict_1.default.doesNotMatch('abcdefg1', auth_validation_1.PASSWORD_STRENGTH_REGEX);
    strict_1.default.doesNotMatch('ABCDEFGH', auth_validation_1.PASSWORD_STRENGTH_REGEX);
    strict_1.default.doesNotMatch('Abcdefgh', auth_validation_1.PASSWORD_STRENGTH_REGEX);
    strict_1.default.doesNotMatch('Abcdef1', auth_validation_1.PASSWORD_STRENGTH_REGEX);
});
