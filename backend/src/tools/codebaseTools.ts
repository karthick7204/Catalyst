import fs from 'fs/promises';
import path from 'path';
import { WorkspaceSandbox } from '../sandbox/workspace.js';
import { ToolDefinition, ToolResult } from './types.js';

export const CODEBASE_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_files',
    description: 'Find files matching a glob or substring in the repository',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Search pattern or file extension (e.g. "*.ts", "auth", "package.json")'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'grep_search',
    description: 'Search for text or regex pattern across files in the repository',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text or regex to search for'
        },
        pathPrefix: {
          type: 'string',
          description: 'Optional subfolder to restrict search to (e.g. "src" or "tests")'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file within the repository, with optional line range',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path of the file relative to repository root'
        },
        startLine: {
          type: 'number',
          description: 'Optional 1-based start line number'
        },
        endLine: {
          type: 'number',
          description: 'Optional 1-based end line number'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'edit_file',
    description: 'Replace an exact target snippet in a file with a replacement snippet',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path of the file relative to repository root'
        },
        target: {
          type: 'string',
          description: 'Exact string to be replaced (must match existing file content exactly)'
        },
        replacement: {
          type: 'string',
          description: 'New content to replace the target'
        }
      },
      required: ['filePath', 'target', 'replacement']
    }
  },
  {
    name: 'create_file',
    description: 'Create a new file or completely overwrite an existing file with given content',
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path of the file relative to repository root'
        },
        content: {
          type: 'string',
          description: 'Full file content to write'
        }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'run_terminal_command',
    description: 'Execute a bash command in the repository workspace (e.g., test runner, build, linter)',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command line to execute (e.g. "npm test", "npm run lint")'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'get_git_diff',
    description: 'Inspect the git diff of all modifications made so far in the repository',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

export class CodebaseToolsManager {
  private sandbox: WorkspaceSandbox;

  constructor(sandbox: WorkspaceSandbox) {
    this.sandbox = sandbox;
  }

  async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    switch (name) {
      case 'search_files':
        return this.searchFiles(args.pattern);
      case 'grep_search':
        return this.grepSearch(args.query, args.pathPrefix);
      case 'read_file':
        return this.readFile(args.filePath, args.startLine, args.endLine);
      case 'edit_file':
        return this.editFile(args.filePath, args.target, args.replacement);
      case 'create_file':
        return this.createFile(args.filePath, args.content);
      case 'run_terminal_command':
        return this.runTerminalCommand(args.command);
      case 'get_git_diff':
        return this.getGitDiff();
      default:
        return { success: false, output: `Unknown tool "${name}"` };
    }
  }

  private async searchFiles(pattern: string): Promise<ToolResult> {
    // Sanitize pattern
    const sanitized = pattern.replace(/[`$;|&]/g, '');
    const cmd = `find . -not -path '*/.*' -not -path '*/node_modules/*' -iname "*${sanitized}*" | head -n 50`;
    const res = await this.sandbox.execCommand(cmd);
    return {
      success: res.exitCode === 0,
      output: res.stdout || 'No matching files found.'
    };
  }

  private async grepSearch(query: string, pathPrefix?: string): Promise<ToolResult> {
    const escapedQuery = query.replace(/"/g, '\\"');
    const targetDir = pathPrefix ? `"${pathPrefix.replace(/"/g, '')}"` : '.';
    const cmd = `grep -rnI --exclude-dir={node_modules,.git,dist,build} "${escapedQuery}" ${targetDir} | head -n 40`;
    const res = await this.sandbox.execCommand(cmd);
    return {
      success: true,
      output: res.stdout || 'No occurrences found.'
    };
  }

  private async readFile(filePath: string, startLine?: number, endLine?: number): Promise<ToolResult> {
    try {
      const fullPath = this.sandbox.resolvePath(filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');

      const start = Math.max(1, startLine || 1);
      const end = Math.min(lines.length, endLine || lines.length);

      const numberedLines = lines
        .slice(start - 1, end)
        .map((line, idx) => `${start + idx}: ${line}`)
        .join('\n');

      return {
        success: true,
        output: numberedLines || '(Empty file or empty range)'
      };
    } catch (err: any) {
      return { success: false, output: `Failed to read file ${filePath}: ${err.message}` };
    }
  }

  private async editFile(filePath: string, target: string, replacement: string): Promise<ToolResult> {
    try {
      const fullPath = this.sandbox.resolvePath(filePath);
      const content = await fs.readFile(fullPath, 'utf8');

      if (!content.includes(target)) {
        return {
          success: false,
          output: `Target snippet not found in ${filePath}. Ensure exact character match including indentation.`
        };
      }

      const occurrences = content.split(target).length - 1;
      if (occurrences > 1) {
        return {
          success: false,
          output: `Target snippet occurs ${occurrences} times in ${filePath}. Provide a more specific surrounding context snippet.`
        };
      }

      const newContent = content.replace(target, replacement);
      await fs.writeFile(fullPath, newContent, 'utf8');

      return {
        success: true,
        output: `Successfully updated ${filePath}`
      };
    } catch (err: any) {
      return { success: false, output: `Failed to edit file: ${err.message}` };
    }
  }

  private async createFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      const fullPath = this.sandbox.resolvePath(filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      return {
        success: true,
        output: `Created file ${filePath}`
      };
    } catch (err: any) {
      return { success: false, output: `Failed to create file: ${err.message}` };
    }
  }

  private async runTerminalCommand(command: string): Promise<ToolResult> {
    const res = await this.sandbox.execCommand(command);
    const combinedOutput = [
      res.stdout ? `STDOUT:\n${res.stdout}` : '',
      res.stderr ? `STDERR:\n${res.stderr}` : '',
      `EXIT CODE: ${res.exitCode}`
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      success: res.exitCode === 0,
      output: combinedOutput
    };
  }

  private async getGitDiff(): Promise<ToolResult> {
    const diff = await this.sandbox.getGitDiff();
    return {
      success: true,
      output: diff
    };
  }
}

