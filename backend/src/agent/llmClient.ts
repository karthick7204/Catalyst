import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { CODEBASE_TOOL_DEFINITIONS } from '../tools/codebaseTools.js';

export interface LLMMessage {
  role: 'user' | 'model' | 'tool';
  content?: string;
  toolCalls?: Array<{
    id?: string;
    name: string;
    args: Record<string, any>;
  }>;
  toolResponse?: {
    name: string;
    content: string;
  };
}

export interface LLMResponse {
  text?: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
}

export class LLMClient {
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
  }

  async generateStep(
    systemPrompt: string,
    history: LLMMessage[]
  ): Promise<LLMResponse> {
    if (config.AI_PROVIDER === 'gemini' && this.geminiClient) {
      return this.callGemini(systemPrompt, history);
    }

    // Fallback: mock response or generic provider if no API key yet configured
    if (!config.GEMINI_API_KEY && !config.ANTHROPIC_API_KEY && !config.OPENAI_API_KEY) {
      logger.warn('No LLM API keys configured. Running in simulated agent mode.');
      return {
        text: 'Catalyst analyzed the bug report and checked the repository. Please configure GEMINI_API_KEY in .env to run autonomous LLM tool executions.'
      };
    }

    throw new Error(`Configured AI_PROVIDER ${config.AI_PROVIDER} not yet initialized.`);
  }

  private async callGemini(
    systemPrompt: string,
    history: LLMMessage[]
  ): Promise<LLMResponse> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    // Convert CODEBASE_TOOL_DEFINITIONS to Gemini function declarations
    const functionDeclarations: FunctionDeclaration[] = CODEBASE_TOOL_DEFINITIONS.map((tool) => {
      const properties: Record<string, any> = {};
      for (const [key, prop] of Object.entries(tool.parameters.properties)) {
        properties[key] = {
          type: prop.type === 'number' ? SchemaType.NUMBER : SchemaType.STRING,
          description: prop.description
        };
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties,
          required: tool.parameters.required
        }
      };
    });

    const model = this.geminiClient.getGenerativeModel({
      model: config.AI_MODEL_NAME || 'gemini-1.5-pro',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations }]
    });

    // Format contents for GoogleGenerativeAI
    const contents = history.map((msg) => {
      if (msg.role === 'tool' && msg.toolResponse) {
        return {
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: msg.toolResponse.name,
                response: { output: msg.toolResponse.content }
              }
            }
          ]
        };
      }

      const parts: any[] = [];
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.args
            }
          });
        }
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts
      };
    });

    const result = await model.generateContent({
      contents: contents as any
    });

    const candidate = result.response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return { text: 'No response from model' };
    }

    let responseText = '';
    const toolCalls: Array<{ name: string; args: Record<string, any> }> = [];

    for (const part of candidate.content.parts) {
      if (part.text) {
        responseText += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: (part.functionCall.args as Record<string, any>) || {}
        });
      }
    }

    return {
      text: responseText.trim() || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  }
}
