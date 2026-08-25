#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner (Node.js / TypeScript Ecosystem)
 * Executes Tier 1, Tier 2, and Tier 4 automated test suites.
 * Outputs unified pass/fail results, total test execution timing, and exits with code 0 on full pass.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ANSI = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const TEST_FILES = [
  // Tier 1: Unit & Schemas
  { name: 'Tier 1: Zod Schemas & Boundary Analysis', path: path.join(__dirname, 'unit', 'validation.test.js') },
  { name: 'Tier 1: Mathematical Heuristics & Monotonicity', path: path.join(__dirname, 'unit', 'math_heuristics.test.js') },
  { name: 'Tier 1: Mock Supabase DB Query Builder', path: path.join(__dirname, 'unit', 'mock_db.test.js') },

  // Tier 2: API Routes Integration
  { name: 'Tier 2: Next.js API Route Handlers', path: path.join(__dirname, 'integration', 'nextjs_api_routes.test.js') },
  { name: 'Tier 2: FastAPI Proxy Resilience & Fallback', path: path.join(__dirname, 'integration', 'proxy_resilience.test.js') },
  { name: 'Tier 2: Database Mutations & Audit Logs', path: path.join(__dirname, 'integration', 'db_mutations.test.js') },

  // Tier 4: Cross-Service E2E Workflows
  { name: 'Tier 4: Cross-Service E2E Data Pipeline', path: path.join(__dirname, 'e2e', 'e2e_pipeline.test.js') },
  { name: 'Tier 4: Regional Disaster Simulation & Response', path: path.join(__dirname, 'e2e', 'disaster_simulation.test.js') },
];

console.log(`${ANSI.bright}${ANSI.cyan}===============================================================================${ANSI.reset}`);
console.log(`${ANSI.bright}${ANSI.cyan}       MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — MASTER E2E RUNNER       ${ANSI.reset}`);
console.log(`${ANSI.bright}${ANSI.cyan}===============================================================================${ANSI.reset}\n`);

let totalPassedSuites = 0;
let totalFailedSuites = 0;
const results = [];
const overallStartTime = Date.now();

for (const test of TEST_FILES) {
  if (!fs.existsSync(test.path)) {
    console.log(`${ANSI.yellow}[SKIP]${ANSI.reset} ${test.name} — File not found: ${test.path}`);
    continue;
  }

  process.stdout.write(`${ANSI.bright}[RUN]${ANSI.reset} ${test.name.padEnd(55)} ... `);
  const start = Date.now();

  const proc = spawnSync(process.execPath, ['--test', test.path], {
    encoding: 'utf-8',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const durationMs = Date.now() - start;
  const isPass = proc.status === 0;

  if (isPass) {
    console.log(`${ANSI.green}PASS${ANSI.reset} ${ANSI.dim}(${durationMs}ms)${ANSI.reset}`);
    totalPassedSuites++;
    results.push({ name: test.name, status: 'PASS', durationMs, output: proc.stdout });
  } else {
    console.log(`${ANSI.red}FAIL${ANSI.reset} ${ANSI.dim}(${durationMs}ms)${ANSI.reset}`);
    totalFailedSuites++;
    results.push({ name: test.name, status: 'FAIL', durationMs, error: proc.stderr || proc.stdout });
  }
}

const totalDurationMs = Date.now() - overallStartTime;

console.log(`\n${ANSI.bright}${ANSI.cyan}-------------------------------------------------------------------------------${ANSI.reset}`);
console.log(`${ANSI.bright}E2E TEST SUMMARY:${ANSI.reset}`);
console.log(`  Total Test Suites : ${totalPassedSuites + totalFailedSuites}`);
console.log(`  Suites Passed      : ${ANSI.green}${totalPassedSuites}${ANSI.reset}`);
console.log(`  Suites Failed      : ${totalFailedSuites > 0 ? ANSI.red : ANSI.green}${totalFailedSuites}${ANSI.reset}`);
console.log(`  Total Execution    : ${(totalDurationMs / 1000).toFixed(2)}s`);
console.log(`${ANSI.bright}${ANSI.cyan}===============================================================================${ANSI.reset}\n`);

if (totalFailedSuites > 0) {
  console.log(`${ANSI.red}${ANSI.bright}FAILURES DETECTED:${ANSI.reset}`);
  for (const r of results.filter((r) => r.status === 'FAIL')) {
    console.log(`\n${ANSI.red}--- Failure in: ${r.name} ---${ANSI.reset}`);
    console.log(r.error);
  }
  process.exit(1);
} else {
  console.log(`${ANSI.green}${ANSI.bright}>>> ALL TEST SUITES PASSED CLEANLY (100% PASS RATE) <<<\n${ANSI.reset}`);
  process.exit(0);
}
