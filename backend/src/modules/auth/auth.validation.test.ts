import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSWORD_STRENGTH_REGEX } from './auth.validation';

test('accepts strong passwords with the required complexity', () => {
  assert.match('Abcdef1!', PASSWORD_STRENGTH_REGEX);
  assert.match('Test123!@', PASSWORD_STRENGTH_REGEX);
});

test('rejects passwords that miss the required rules', () => {
  assert.doesNotMatch('abcdefg1', PASSWORD_STRENGTH_REGEX);
  assert.doesNotMatch('ABCDEFGH', PASSWORD_STRENGTH_REGEX);
  assert.doesNotMatch('Abcdefgh', PASSWORD_STRENGTH_REGEX);
  assert.doesNotMatch('Abcdef1', PASSWORD_STRENGTH_REGEX);
});
