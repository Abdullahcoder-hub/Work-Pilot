import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { ApiError } from './ApiError';
import { logger } from './logger';
import { CreateLlmMessageInput, LlmContentBlock, LlmMessage, LlmResponse } from './llmTypes';

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

interface GeminiPart {
  text?: string;
  functionCall?: { id?: string; name: string; args: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  /**
   * Gemini 3.x's "thinking" models attach an encrypted signature to
   * text/functionCall parts, and REQUIRE it to be echoed back verbatim
   * on any functionCall part replayed into a later request — otherwise
   * the API rejects the request outright. See
   * https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures
   */
  thoughtSignature?: string;
}

function toGeminiRole(role: LlmMessage['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

/**
 * Gemini has no tool_result concept exactly like Anthropic's — a
 * function's result goes back as a `functionResponse` part, matched to
 * the call by function *name* (and, since the 3.5 generation, a matching
 * `id`) rather than Anthropic's `tool_use_id`. That's why
 * LlmContentBlock's tool_result carries `name` even though Anthropic's
 * own wire format doesn't need it — this file is where it gets used.
 */
function toGeminiParts(content: string | LlmContentBlock[]): GeminiPart[] {
  if (typeof content === 'string') return [{ text: content }];
  return content.map((block): GeminiPart => {
    if (block.type === 'text') {
      return { text: block.text, ...(block.thoughtSignature ? { thoughtSignature: block.thoughtSignature } : {}) };
    }
    if (block.type === 'tool_use') {
      return {
        functionCall: { id: block.id, name: block.name, args: block.input },
        ...(block.thoughtSignature ? { thoughtSignature: block.thoughtSignature } : {}),
      };
    }
    // tool_result
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(block.content) as Record<string, unknown>;
    } catch {
      parsed = { result: block.content };
    }
    return { functionResponse: { id: block.tool_use_id.startsWith('gemini-call-') ? undefined : block.tool_use_id, name: block.name, response: parsed } };
  });
}

function fromGeminiParts(parts: GeminiPart[]): LlmContentBlock[] {
  return parts.map((part, index): LlmContentBlock => {
    const signature = part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {};
    if (part.functionCall) {
      // Prefer Gemini's own call id when the model provides one (3.x
      // models do); fall back to a synthetic id scoped to this response
      // for older models that don't, since this app only ever makes one
      // tool call per turn.
      const id = part.functionCall.id ?? `gemini-call-${index}`;
      return { type: 'tool_use', id, name: part.functionCall.name, input: part.functionCall.args, ...signature };
    }
    return { type: 'text', text: part.text ?? '', ...signature };
  });
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(message: string, attempt: number) {
  const match = message.match(/retry in\s+([\d.]+)(ms|s)/i);

  if (match) {
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'ms'
      ? value
      : value * 1000;
  }

  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

function shouldRetry(message: string) {
  return /429|RESOURCE_EXHAUSTED|500|503|timeout|ECONNRESET/i.test(
    message
  );
}

export async function createGeminiMessage(
  input: CreateLlmMessageInput
): Promise<LlmResponse> {
  if (!env.geminiApiKey) {
    throw ApiError.badRequest(
      'The AI Assistant is not configured yet — an administrator needs to set GEMINI_API_KEY in the backend .env file.'
    );
  }

  const contents = input.messages.map((m) => ({
    role: toGeminiRole(m.role),
    parts: toGeminiParts(m.content),
  }));

  const config: Record<string, unknown> = {
    systemInstruction: input.system,
    maxOutputTokens: input.maxTokens ?? 1024,
  };

  if (input.tools) {
    config.tools = [
      {
        functionDeclarations: input.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parametersJsonSchema: t.input_schema,
        })),
      },
    ];
  }

  let response!: Awaited<
    ReturnType<GoogleGenAI["models"]["generateContent"]>
  >;

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await getClient().models.generateContent({
          model: env.geminiModel,
          contents,
          config,
        });

        break;
      } catch (err) {
        const message = errorMessage(err);

        if (!shouldRetry(message) || attempt === 2) {
          throw err;
        }

        logger.warn(`Gemini retry ${attempt + 1}/3`);

        await sleep(retryDelay(message, attempt));
      }
    }
  } catch (err) {
    const message = errorMessage(err);

    logger.error("Gemini API request failed", { message });

    if (/api key not valid|permission denied|401|403/i.test(message)) {
      throw ApiError.internal(
        "The AI Assistant is misconfigured — GEMINI_API_KEY appears to be invalid."
      );
    }

    if (/not found|404/i.test(message)) {
      throw ApiError.internal(
        `The configured model "${env.geminiModel}" was not found.`
      );
    }

    if (/RESOURCE_EXHAUSTED|quota exceeded|429/i.test(message)) {
      throw ApiError.tooManyRequests(
        "AI quota exceeded. Please try again later."
      );
    }

    throw ApiError.internal(
      "The AI Assistant had trouble responding. Try again in a moment."
    );
  }

  const candidate = response.candidates?.[0];

  if (!candidate?.content?.parts) {
    const reason = response.promptFeedback?.blockReason;

    throw ApiError.badRequest(
      reason
        ? `The AI Assistant couldn't respond to that (${reason}).`
        : "The AI Assistant couldn't generate a response."
    );
  }

  return {
    content: fromGeminiParts(candidate.content.parts as GeminiPart[]),
    stopReason: candidate.finishReason ?? "STOP",
  };
}