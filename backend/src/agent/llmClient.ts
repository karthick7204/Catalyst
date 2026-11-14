import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { CODEBASE_TOOL_DEFINITIONS } from '../tools/codebaseTools.js';

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface StepResponse {
  text?: string;
  toolCalls?: ToolCall[];
}

export interface ChatSession {
  sendMessage(prompt: string): Promise<StepResponse>;
  sendToolResponses(responses: Array<{ name: string; output: string }>): Promise<StepResponse>;
}

export class LLMClient {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    }
  }

  createChatSession(systemPrompt: string): ChatSession {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    // Convert tool definitions to GoogleGenAI function declarations
    const functionDeclarations = CODEBASE_TOOL_DEFINITIONS.map((tool) => {
      const properties: Record<string, any> = {};
      for (const [key, prop] of Object.entries(tool.parameters.properties)) {
        properties[key] = {
          type: prop.type === 'number' ? Type.NUMBER : Type.STRING,
          description: prop.description
        };
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          properties,
          required: tool.parameters.required
        }
      };
    });

    const modelName = config.AI_MODEL_NAME || 'gemini-3.5-flash';

    const chat = this.ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations }]
      }
    });

    const parseResponse = (res: any): StepResponse => {
      const toolCalls: ToolCall[] = [];
      if (res.functionCalls && Array.isArray(res.functionCalls)) {
        for (const fc of res.functionCalls) {
          toolCalls.push({
            name: fc.name,
            args: fc.args || {},
            id: fc.id
          });
        }
      }

      return {
        text: res.text || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
    };

    return {
      async sendMessage(prompt: string): Promise<StepResponse> {
        logger.debug({ prompt }, 'Sending prompt to Gemini');
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await chat.sendMessage({ message: prompt });
            return parseResponse(res);
          } catch (err: any) {
            if ((err.status === 503 || err.status === 429) && attempt < 3) {
              logger.warn(`Gemini temporary rate limit / spike (attempt ${attempt}). Retrying in 2 seconds...`);
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            throw err;
          }
        }
        throw new Error('Failed to send message after retries');
      },

      async sendToolResponses(responses: Array<{ name: string; output: string }>): Promise<StepResponse> {
        logger.debug({ responseCount: responses.length }, 'Sending tool responses to Gemini');
        const formatted = responses.map((r) => ({
          functionResponse: {
            name: r.name,
            response: { output: r.output }
          }
        }));

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await chat.sendMessage({ message: formatted as any });
            return parseResponse(res);
          } catch (err: any) {
            if ((err.status === 503 || err.status === 429) && attempt < 3) {
              logger.warn(`Gemini temporary rate limit / spike (attempt ${attempt}). Retrying in 2 seconds...`);
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            throw err;
          }
        }
        throw new Error('Failed to send tool responses after retries');
      }
    };
  }
}
