import { prisma } from '../src/config/database.js';

async function seed() {
  console.log('Seeding sample active triage for review...');
  
  const sampleAwaiting = await prisma.taskJob.create({
    data: {
      linearIssueId: 'issue_review_' + Date.now(),
      linearIssueIdentifier: 'DEMO-43',
      linearIssueTitle: 'Fix discount code validation causing NaN in checkout total calculation',
      linearIssueDescription: `Customers report that checkout calculations produce NaN when applying certain promo codes with uppercase letters or leading spaces.

Steps to reproduce:
1. Add items to checkout cart.
2. Enter promo code '  WELCOME10  ' or 'SAVE20'.
3. Observe rawTotal calculating as NaN due to non-numeric fallback.

Target repository: https://github.com/karthick7204/catalyst-demo-repo
Please sanitize discount percentage input in src/discount.js and ensure all unit tests pass with npm test.`,
      linearIssueUrl: 'https://linear.app/demo-team/issue/DEMO-43',
      githubRepo: 'karthick7204/catalyst-demo-repo',
      baseBranch: 'main',
      fixBranch: 'catalyst/fix-demo-43-nan',
      status: 'AWAITING_APPROVAL',
      approvalToken: 'token_demo_43_' + Date.now(),
      diffContent: `diff --git a/src/discount.js b/src/discount.js
index 9c7a23..e4f9b2 100644
--- a/src/discount.js
+++ b/src/discount.js
@@ -40,5 +40,6 @@ function applyDiscount(cart, promo) {
   const discountPercent = promo.value || 0;
-  const rawTotal = cart.subtotal * (1 - discountPercent / 100);
-  return rawTotal;
+  const safeDiscount = Number.isFinite(discountPercent) ? Math.min(100, Math.max(0, discountPercent)) : 0;
+  const rawTotal = Math.max(0, cart.subtotal * (1 - safeDiscount / 100));
+  return Number(rawTotal.toFixed(2));
 }
`,
      fixSummary: `### Root Cause Analysis
A non-numeric or malformed promo.value bypassed the fallback check, causing mathematical operations to yield NaN, propagating downstream to Stripe charge initialization.

### Summary of Changes
- Implemented Number.isFinite validation on discountPercent.
- Defensive bounds clamping applied [0, 100].
- Safe rounding to 2 decimal places to prevent floating-point calculation errors.

### Verification Results
Ran test specification tests/discount.spec.js:
- Edge cases verified: null promo, empty string, infinity values, and negative percentage inputs.
- All unit assertions passed (3/3 passing).`,
      testOutput: `> catalyst-demo@1.0.0 test
> node --test tests/discount.spec.js

✔ calculates 10% discount accurately for WELCOME10 (12.4ms)
✔ prevents negative totals for FLAT50 coupon on small cart amounts (8.1ms)
✔ handles malformed promo codes safely without yielding NaN (14.2ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 148.6`,
    }
  });

  console.log('Created awaiting approval job:', sampleAwaiting.linearIssueIdentifier);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
