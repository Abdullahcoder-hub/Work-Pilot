export type LlmRole = 'user' | 'assistant';

export type LlmContentBlock =
  | { type: 'text'; text: string; thoughtSignature?: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown>; thoughtSignature?: string }
  | { type: 'tool_result'; tool_use_id: string; name: string; content: string };

export interface LlmMessage {
  role: LlmRole;
  content: string | LlmContentBlock[];
}

export interface LlmTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface CreateLlmMessageInput {
  system: string;
  messages: LlmMessage[];
  tools?: LlmTool[];
  maxTokens?: number;
}

export interface LlmResponse {
  content: LlmContentBlock[];
  stopReason: string;
}
