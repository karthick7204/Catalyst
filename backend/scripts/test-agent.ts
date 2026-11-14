import { WorkspaceSandbox } from '../src/sandbox/workspace.js';
import { AgentOrchestrator } from '../src/agent/orchestrator.js';

async function testAgent() {
  console.log('Testing Agent Orchestrator...');
  const sandbox = new WorkspaceSandbox('test-job-' + Date.now(), 'karthick7204/catalyst-demo-repo', 'TEST-1');
  await sandbox.initialize();
  console.log('Sandbox initialized at:', sandbox.workspacePath);

  const orchestrator = new AgentOrchestrator();
  const result = await orchestrator.run(sandbox, {
    jobId: 'test-job-1',
    issueIdentifier: 'TEST-1',
    issueTitle: 'Fix discount calculation bugs',
    issueDescription: 'WELCOME10 gives 1% instead of 10%. FLAT50 allows negative totals. Verify with npm test.'
  });

  console.log('AGENT EXECUTION RESULT:');
  console.log('Success:', result.success);
  console.log('Summary:\n', result.fixSummary);
  console.log('Diff:\n', result.diff);

  await sandbox.cleanup();
}

testAgent().catch(err => {
  console.error('AGENT FAILED:', err);
});

