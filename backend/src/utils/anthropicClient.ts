import { env } from '../config/env';
import { ApiError } from './ApiError';
import { logger } from './logger';
import { CreateLlmMessageInput, LlmContentBlock, LlmMessage, LlmResponse } from './llmTypes';

/** Anthropic's wire format matches LlmContentBlock almost exactly — this only strips the `name` field tool_result carries for Gemini's benefit, which Anthropic's schema doesn't expect. */
function toAnthropicContent(content: string | LlmContentBlock[]): unknown {
  if (typeof content === 'string') return content;
  return content.map((block) => {
    if (block.type === 'tool_result') {
      return { type: 'tool_result', tool_use_id: block.tool_use_id, content: block.content };
    }
    return block;
  });
}

interface AnthropicApiResponse {
  content: LlmContentBlock[];
  stop_reason: string;
}

/**
 * Calls Anthropic's Messages API directly over fetch — deliberately no SDK
 * dependency for one call site. Throws a clear, user-facing ApiError
 * rather than letting a raw fetch/HTTP error leak to the client.
 */
export async function createAnthropicMessage(input: CreateLlmMessageInput): Promise<LlmResponse> {
  if (!env.anthropicApiKey) {
    throw ApiError.badRequest(
      'The AI Assistant is not configured yet — an administrator needs to set ANTHROPIC_API_KEY (or GEMINI_API_KEY) in the backend .env file.'
    );
  }

  const messages = input.messages.map((m: LlmMessage) => ({ role: m.role, content: toAnthropicContent(m.content) }));

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: input.maxTokens ?? 1024,
        system: input.system,
        messages,
        ...(input.tools ? { tools: input.tools } : {}),
      }),
    });
  } catch (err) {
    logger.error('Anthropic API request failed', { err: err instanceof Error ? err.message : err });
    throw ApiError.internal('Could not reach the AI service. Try again in a moment.');
  }

  if (!response.ok) {
    const body = await response.text();
    logger.error('Anthropic API returned an error', { status: response.status, body });
    if (response.status === 401) {
      throw ApiError.internal('The AI Assistant is misconfigured — ANTHROPIC_API_KEY appears to be invalid.');
    }
    if (response.status === 404) {
      throw ApiError.internal(
        `The configured model "${env.anthropicModel}" was not found. Check ANTHROPIC_MODEL in the backend .env against the current model list at https://docs.claude.com.`
      );
    }
    throw ApiError.internal('The AI Assistant had trouble responding. Try again in a moment.');
  }

  const data = (await response.json()) as AnthropicApiResponse;
  return { content: data.content, stopReason: data.stop_reason };
}
