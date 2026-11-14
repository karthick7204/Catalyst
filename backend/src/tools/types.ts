export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; items?: any }>;
    required: string[];
  };
}

export interface ToolExecutionContext {
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output: string;
}

