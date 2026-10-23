import crypto from 'crypto';

const SECRET = process.env.LINEAR_WEBHOOK_SECRET || 'test_linear_webhook_secret_12345';
const PORT = process.env.PORT || '3001';
const URL = `http://localhost:${PORT}/api/webhooks/linear`;

const samplePayload = {
  action: 'create',
  type: 'Issue',
  data: {
    id: 'issue-uuid-1234-5678',
    identifier: 'ENG-123',
    title: 'Fix null pointer exception in auth service',
    description: 'Found bug while initializing session. Target repository: https://github.com/octocat/Hello-World.git',
    labels: [
      { id: 'lbl-1', name: 'bug' },
      { id: 'lbl-2', name: 'ai-fix' },
    ],
  },
  url: 'https://linear.app/issue/ENG-123',
  createdAt: new Date().toISOString(),
};

const rawBody = JSON.stringify(samplePayload);
const signature = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');

console.log('--- Mock Linear Webhook Dispatcher ---');
console.log(`Target URL: ${URL}`);
console.log(`Secret:     ${SECRET}`);
console.log(`Computed Signature: ${signature}`);
console.log('\nPayload:');
console.log(rawBody);

console.log('\nEquivalent curl command:');
console.log(`curl -X POST "${URL}" \\
  -H "Content-Type: application/json" \\
  -H "Linear-Signature: ${signature}" \\
  -d '${rawBody.replace(/'/g, "'\\''")}'
`);
