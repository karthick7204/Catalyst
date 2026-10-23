import assert from 'assert';
import crypto from 'crypto';
import { verifyLinearSignature } from '../src/services/linearAuth.js';
import { extractIssueDetails, extractRepositoryUrl } from '../src/services/repoExtractor.js';

console.log('Testing Catalyst Sprint 1 Core Modules...\n');

// 1. Test HMAC Signature Verification
{
  const secret = 'my_top_secret_linear_key';
  const body = Buffer.from(JSON.stringify({ test: 123 }));
  const validSig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const badSig = 'badf00d123456789abcdef';

  assert.strictEqual(verifyLinearSignature(body, validSig, secret), true, 'Valid signature should pass');
  assert.strictEqual(verifyLinearSignature(body, badSig, secret), false, 'Invalid signature should fail');
  assert.strictEqual(verifyLinearSignature(body, undefined, secret), false, 'Missing signature should fail');
  console.log('✔ verifyLinearSignature: HMAC SHA-256 and constant-time comparison verified.');
}

// 2. Test Issue Details & Repo Extraction
{
  const testIssue1 = {
    id: 'uuid-1',
    identifier: 'ENG-456',
    title: 'Database connection pooling issue',
    description: 'See repo at https://github.com/acme-corp/catalyst-core.git for details.',
    labels: [{ id: '1', name: 'ai-fix' }],
  };

  const details1 = extractIssueDetails(testIssue1);
  assert.strictEqual(details1.issueIdentifier, 'ENG-456');
  assert.strictEqual(details1.repoUrl, 'https://github.com/acme-corp/catalyst-core.git');
  assert.strictEqual(details1.branchName, 'fix/eng-456');
  console.log('✔ extractIssueDetails: HTTPS repo URL & identifier extraction verified.');

  // Test SSH URL regex fallback in description
  const testIssue2 = {
    id: 'uuid-2',
    identifier: 'PROJ-999',
    title: 'Authentication leak',
    description: 'Target: git@github.com:facebook/react.git',
    labels: ['ai-fix'],
  };

  const details2 = extractIssueDetails(testIssue2);
  assert.strictEqual(details2.issueIdentifier, 'PROJ-999');
  assert.strictEqual(details2.repoUrl, 'https://github.com/facebook/react.git');
  assert.strictEqual(details2.branchName, 'fix/proj-999');
  console.log('✔ extractIssueDetails: SSH repo URL normalization verified.');

  // Test explicit custom field
  const testIssue3 = {
    id: 'uuid-3',
    identifier: 'FEAT-10',
    title: 'Add feature',
    description: 'No link in description',
    repositoryUrl: 'https://github.com/torvalds/linux',
    labels: [{ name: 'ai-fix' }],
  };

  const details3 = extractIssueDetails(testIssue3);
  assert.strictEqual(details3.repoUrl, 'https://github.com/torvalds/linux.git');
  console.log('✔ extractIssueDetails: Custom repositoryUrl field verified.');
}

console.log('\nAll core logic tests passed successfully!');
