import { env } from '../config/env';
import { createAnthropicMessage } from './anthropicClient';
import { createGeminiMessage } from './geminiClient';
import { CreateLlmMessageInput, LlmResponse } from './llmTypes';

/**
 * The AI Assistant talks to whichever provider is configured, through the
 * same LlmMessage/LlmTool/LlmResponse shapes either way — ai.service.ts
 * never needs to know or care which one is actually running. See
 * config/env.ts for how the provider is chosen (explicit AI_PROVIDER, or
 * auto-detected from which API key is set).
 */
export async function createLlmMessage(input: CreateLlmMessageInput): Promise<LlmResponse> {
  if (env.aiProvider === 'gemini') return createGeminiMessage(input);
  return createAnthropicMessage(input);
}
