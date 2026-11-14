/**
 * Script to simulate a Linear webhook event locally for testing Catalyst
 *
 * Usage:
 *   npx tsx scripts/simulate-linear-webhook.ts
 */

const WEBHOOK_URL = process.env.CATALYST_URL || 'http://localhost:3000/webhooks/linear';

async function simulateWebhook() {
  console.log(`📡 Sending simulated Linear webhook to ${WEBHOOK_URL}...\n`);

  const mockPayload = {
    action: 'create',
    type: 'Issue',
    data: {
      id: 'issue_' + Date.now(),
      identifier: 'ENG-101',
      title: 'Fix typo and greeting message',
      description: `
There is an issue where the welcome message is misspelled.
Target repository: https://github.com/karthick7204/Catalyst
Please inspect the codebase, fix the issue, and ensure tests pass.
      `.trim(),
      url: 'https://linear.app/my-team/issue/ENG-101'
    }
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    const result = await response.json();
    console.log('✅ Response from Catalyst:', result);
    console.log('\nCheck your Catalyst server logs to watch the agent in action!');
  } catch (err: any) {
    console.error('❌ Failed to connect to Catalyst server:', err.message);
    console.log('Make sure "npm run dev" is running in another terminal.');
  }
}

simulateWebhook();
