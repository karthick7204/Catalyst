/**
 * Script to simulate a Linear webhook event locally for testing Catalyst
 *
 * Usage:
 *   npx tsx scripts/simulate-linear-webhook.ts
 */
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = process.env.CATALYST_URL || 'http://localhost:3000/webhooks/linear';
const TARGET_REPO = process.env.TARGET_REPO || 'https://github.com/karthick7204/catalyst-demo-repo';
const SECRET = process.env.LINEAR_WEBHOOK_SECRET;

async function simulateWebhook() {
  console.log(`📡 Sending simulated Linear webhook to ${WEBHOOK_URL}...`);
  console.log(`🎯 Target Repository: ${TARGET_REPO}\n`);

  const mockPayload = {
    action: 'create',
    type: 'Issue',
    data: {
      id: 'issue_' + Date.now(),
      identifier: 'DEMO-42',
      title: 'Fix shopping cart discount calculation bugs',
      description: `
Customers reported two critical issues with coupons in the discount module:
1. The 'WELCOME10' coupon is only applying a 1% discount instead of the expected 10%.
2. The 'FLAT50' coupon allows the total to become negative on carts under $50.

Target repository: ${TARGET_REPO}
Please inspect the codebase, fix the bugs in src/discount.js, and verify that all unit tests pass (npm test).
      `.trim(),
      url: 'https://linear.app/demo-team/issue/DEMO-42'
    }
  };

  const bodyString = JSON.stringify(mockPayload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (SECRET) {
    const hmac = crypto.createHmac('sha256', SECRET);
    headers['linear-signature'] = hmac.update(bodyString).digest('hex');
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: bodyString
    });

    const result = await response.json();
    console.log('✅ Response from Catalyst:', result);
    console.log('\n👀 Watch your Catalyst server logs to see the AI agent:');
    console.log('   1. Clone repository to sandbox');
    console.log('   2. Run "npm test" to reproduce the 2 test failures');
    console.log('   3. Edit src/discount.js to fix the calculations');
    console.log('   4. Re-run tests to verify 100% pass');
    console.log('   5. Pause in AWAITING_APPROVAL and generate the approval link!\n');
  } catch (err: any) {
    console.error('❌ Failed to connect to Catalyst server:', err.message);
    console.log('Make sure "npm run dev" is running in another terminal.');
  }
}

simulateWebhook();
