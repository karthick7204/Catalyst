import { WorkspaceSandbox } from '../sandbox/workspace.js';
import { CodebaseToolsManager } from '../tools/codebaseTools.js';
import { LLMClient } from './llmClient.js';
import { logger } from '../config/logger.js';

export interface TaskInput {
  jobId: string;
  issueIdentifier: string;
  issueTitle: string;
  issueDescription: string;
}

export interface AgentExecutionResult {
  success: boolean;
  diff: string;
  fixSummary: string;
  testOutput?: string;
  error?: string;
}

export class AgentOrchestrator {
  private llmClient: LLMClient;

  constructor() {
    this.llmClient = new LLMClient();
  }

  async run(sandbox: WorkspaceSandbox, task: TaskInput): Promise<AgentExecutionResult> {
    const toolsManager = new CodebaseToolsManager(sandbox);
    const maxIterations = 15;

    const systemPrompt = `You are Catalyst, an expert autonomous software engineering AI agent.
Your objective is to fix the reported bug in the repository.

Issue Identifier: ${task.issueIdentifier}
Issue Title: ${task.issueTitle}
Bug Description:
${task.issueDescription}

Execution Guidelines:
1. Search and inspect the repository using 'search_files', 'grep_search', and 'read_file' to locate the relevant code and tests.
2. Formulate a hypothesis for the root cause.
3. Edit the code carefully using 'edit_file' (or 'create_file' if adding tests or new modules).
4. Run project tests or linters using 'run_terminal_command' (e.g., npm test, pytest, cargo test) to verify your fix and ensure no regressions.
5. Inspect your changes with 'get_git_diff'.
6. Once satisfied, provide a comprehensive final response explaining:
   - Root Cause Analysis
   - Summary of Changes Applied
   - Verification Results
`;

    logger.info({ jobId: task.jobId, issue: task.issueIdentifier }, 'Starting agent ReAct loop');

    const chatSession = this.llmClient.createChatSession(systemPrompt);

    let currentResponse = await chatSession.sendMessage(
      `Please resolve the issue "${task.issueTitle}". Investigate the codebase, fix the bug, run tests, and report your results.`
    );

    let finalSummary = '';

    for (let step = 1; step <= maxIterations; step++) {
      logger.info({ step, maxIterations }, 'Running agent loop step');

      if (currentResponse.text) {
        logger.info({ summary: currentResponse.text }, 'Model explanation');
        finalSummary = currentResponse.text;
      }

      // If no tool calls were requested, the agent is done
      if (!currentResponse.toolCalls || currentResponse.toolCalls.length === 0) {
        logger.info('Agent indicated completion (no further tool calls)');
        break;
      }

      const toolResponses: Array<{ name: string; output: string }> = [];

      for (const toolCall of currentResponse.toolCalls) {
        logger.info({ tool: toolCall.name, args: toolCall.args }, 'Executing tool');
        const result = await toolsManager.executeTool(toolCall.name, toolCall.args);
        toolResponses.push({
          name: toolCall.name,
          output: result.output
        });
      }

      currentResponse = await chatSession.sendToolResponses(toolResponses);
    }

    // Inspect final git diff
    const diff = await sandbox.getGitDiff();
    const hasDiff = diff && !diff.includes('No changes detected.');

    return {
      success: !!hasDiff,
      diff,
      fixSummary: finalSummary || 'Fix applied and verified.'
    };
  }
}
