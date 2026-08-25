/**
 * =============================================================================
 * MASTER UNIT TEST RUNNER — TIER 1 VALIDATION & DATA LAYER
 * =============================================================================
 * Executes all unit test suites (Zod Schemas, Mock Supabase Client, Heuristic Predictor)
 * and generates detailed verification logs.
 */

import { runValidationTests } from './validation.test';
import { runMockSupabaseTests } from './mock-supabase.test';
import { runFallbackPredictorTests } from './fallback-predictor.test';

export async function runAllUnitTests() {
  console.log('=============================================================================');
  console.log('MOIL PREDICTIVE INTELLIGENCE PLATFORM — TIER 1 UNIT TEST SUITE');
  console.log('=============================================================================\n');

  const validationResults = runValidationTests();
  const mockDbResults = runMockSupabaseTests();
  const predictorResults = runFallbackPredictorTests();

  // Allow async tests in mockDb to settle if needed
  await new Promise((r) => setTimeout(r, 100));

  const allResults = [
    { suite: '1. Zod Validation & Schema Integrity', results: validationResults },
    { suite: '2. Mock Supabase Client & Query Builder', results: mockDbResults },
    { suite: '3. Mathematical Heuristic Shortfall Predictor', results: predictorResults },
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const { suite, results } of allResults) {
    console.log(`\n--- ${suite} ---`);
    for (const r of results) {
      totalTests++;
      if (r.passed) {
        totalPassed++;
        console.log(`  [PASS] ${r.name}`);
      } else {
        totalFailed++;
        console.log(`  [FAIL] ${r.name}`);
        console.log(`         Error: ${r.error}`);
      }
    }
  }

  console.log('\n=============================================================================');
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log('=============================================================================');

  return {
    total: totalTests,
    passed: totalPassed,
    failed: totalFailed,
    success: totalFailed === 0,
    results: allResults,
  };
}

// Auto-run if invoked directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllUnitTests().then((res) => {
    if (!res.success) {
      process.exit(1);
    }
  });
}
