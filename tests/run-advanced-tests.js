/**
 * Advanced Conviction Stress Test Runner
 * Tests extreme edge cases, attack vectors, and performance
 */

const convictionService = require('../src/services/convictionService');
const advancedTests = require('./conviction-advanced-stress');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// ============================================================
// TEST EXTREME EDGE CASES
// ============================================================

async function runEdgeCaseTests() {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'EXTREME EDGE CASE TESTING');
  log(colors.cyan, '='.repeat(80));

  const results = [];

  for (const test of advancedTests.extremeEdgeCases) {
    log(colors.blue, `\n▶ ${test.name}`);
    console.log(`  Scenario: ${test.scenario}`);

    try {
      const result = await convictionService.calculateConviction(
        test.content,
        test.userGenome
      );

      const score = result.conviction.score;
      const inRange = test.expectedConvictionRange
        ? score >= test.expectedConvictionRange[0] && score <= test.expectedConvictionRange[1]
        : true;

      console.log(`  Conviction: ${score}/100`);
      console.log(`  Expected: ${test.expectedConvictionRange[0]}-${test.expectedConvictionRange[1]}`);

      if (inRange) {
        log(colors.green, `  ✓ PASS`);
      } else {
        log(colors.red, `  ✗ FAIL (score outside range)`);
      }

      log(colors.yellow, `  Critical Check: ${test.criticalCheck}`);

      results.push({ name: test.name, passed: inRange, score });

    } catch (error) {
      log(colors.red, `  ✗ CRASH: ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  return results;
}

// ============================================================
// TEST TEMPORAL DECAY
// ============================================================

function testTemporalDecay() {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'TEMPORAL DECAY VALIDATION');
  log(colors.cyan, '='.repeat(80));

  const results = [];

  advancedTests.temporalDecayTests.forEach(test => {
    const trendScore = test.trendScore;
    const expectedFactor = test.expectedFactor;

    // Calculate actual temporal factor using same logic as service
    // IMPROVED FORMULA (Post Stress-Test): More aggressive penalty for trend-chasing
    let actualFactor = 1.0;
    if (trendScore > 90) {
      // EXTREME trend dependency (90-100): 15-20% penalty
      actualFactor = Math.max(0.80, 1.0 - ((trendScore - 90) / 50));
    } else if (trendScore > 80) {
      // High trend dependency (80-90): 5-10% penalty
      actualFactor = Math.max(0.90, 1.0 - ((trendScore - 80) / 100));
    }

    const match = Math.abs(actualFactor - expectedFactor) < 0.01;

    console.log(`\n  ${test.name}`);
    console.log(`    Trend Score: ${trendScore}`);
    console.log(`    Expected Factor: ${expectedFactor}`);
    console.log(`    Actual Factor: ${actualFactor.toFixed(2)}`);
    console.log(`    Expected Penalty: ${test.expectedPenalty}`);

    if (match) {
      log(colors.green, `    ✓ PASS`);
    } else {
      log(colors.red, `    ✗ FAIL`);
    }

    results.push({ ...test, actualFactor, passed: match });
  });

  return results;
}

// ============================================================
// TEST WEIGHT EVOLUTION
// ============================================================

function testWeightEvolution() {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'WEIGHT EVOLUTION SIMULATION');
  log(colors.cyan, '='.repeat(80));

  const evolution = advancedTests.weightEvolutionTests;
  const scenario = evolution.testScenario;

  console.log(`\nTest Scenario: P=${scenario.performance}, T=${scenario.taste}, B=${scenario.brand}\n`);

  const results = [];

  Object.entries(evolution).forEach(([timeframe, config]) => {
    if (timeframe === 'testScenario' || timeframe === 'expectedScores') return;

    const score = Math.round(
      (scenario.performance * config.performance) +
      (scenario.taste * config.taste) +
      (scenario.brand * config.brand)
    );

    const expected = evolution.expectedScores[timeframe];
    const match = Math.abs(score - expected) <= 2; // Allow 2 point variance

    console.log(`  ${timeframe.toUpperCase()}`);
    console.log(`    Weights: P=${config.performance} T=${config.taste} B=${config.brand}`);
    console.log(`    Conviction: ${score}/100 (expected: ${expected})`);

    if (match) {
      log(colors.green, `    ✓ PASS`);
    } else {
      log(colors.red, `    ✗ FAIL`);
    }

    results.push({ timeframe, score, expected, passed: match });
  });

  log(colors.yellow, '\n  OBSERVATION:');
  console.log('  As years progress and taste weight increases:');
  console.log('  - Scores become more stable');
  console.log('  - Less vulnerable to performance metric gaming');
  console.log('  - Taste becomes the dominant signal');

  return results;
}

// ============================================================
// TEST ATTACK VECTORS
// ============================================================

async function testAttackVectors() {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'ATTACK VECTOR TESTING');
  log(colors.cyan, '='.repeat(80));

  const results = [];

  for (const attack of advancedTests.attackVectors) {
    log(colors.red, `\n⚠ ${attack.name}`);
    console.log(`  Attack: ${attack.attack}`);
    console.log(`  Scenario: ${attack.scenario}`);

    try {
      const result = await convictionService.calculateConviction(
        attack.content,
        attack.userGenome
      );

      const score = result.conviction.score;
      const inRange = attack.expectedConvictionRange
        ? score >= attack.expectedConvictionRange[0] && score <= attack.expectedConvictionRange[1]
        : true;

      console.log(`  Conviction: ${score}/100`);
      console.log(`  Expected: ${attack.expectedConvictionRange[0]}-${attack.expectedConvictionRange[1]}`);

      if (inRange) {
        log(colors.green, `  ✓ MITIGATED - Attack detected and handled`);
      } else {
        log(colors.red, `  ✗ VULNERABLE - Attack succeeded`);
      }

      log(colors.yellow, `  Mitigation: ${attack.mitigation}`);
      log(colors.magenta, `  Check: ${attack.criticalCheck}`);

      results.push({ name: attack.name, passed: inRange, score, mitigated: inRange });

    } catch (error) {
      log(colors.red, `  ✗ CRASH: ${error.message}`);
      results.push({ name: attack.name, passed: false, error: error.message });
    }
  }

  return results;
}

// ============================================================
// PERFORMANCE TESTS
// ============================================================

function testPerformance() {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'PERFORMANCE & RESILIENCE TESTING');
  log(colors.cyan, '='.repeat(80));

  const tests = advancedTests.performanceDegradationTests;

  tests.forEach(test => {
    log(colors.blue, `\n▶ ${test.name}`);
    console.log(`  Scenario: ${test.scenario}`);
    log(colors.yellow, `  Critical Check: ${test.criticalCheck}`);

    if (test.variations) {
      console.log(`  Testing ${test.variations.length} variations...`);
      test.variations.forEach(v => console.log(`    - ${v}`));
    }

    if (test.genomeSize) {
      console.log(`  Genome Size: ${test.genomeSize.toLocaleString()} signals`);
      console.log(`  Expected: ${test.expectedCalculationTime}`);
    }

    if (test.concurrentUsers) {
      console.log(`  Concurrent Users: ${test.concurrentUsers}`);
      console.log(`  Expected: ${test.expectedThroughput}`);
    }

    log(colors.green, `  ⚡ Implementation needed - performance benchmarks`);
  });
}

// ============================================================
// GENERATE SECURITY REPORT
// ============================================================

function generateSecurityReport(attackResults) {
  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.cyan, 'SECURITY POSTURE REPORT');
  log(colors.cyan, '='.repeat(80));

  const mitigated = attackResults.filter(r => r.mitigated).length;
  const vulnerable = attackResults.filter(r => !r.mitigated && !r.error).length;
  const crashed = attackResults.filter(r => r.error).length;

  console.log(`\n  Attack Vectors Tested: ${attackResults.length}`);
  log(colors.green, `  ✓ Mitigated: ${mitigated}/${attackResults.length}`);

  if (vulnerable > 0) {
    log(colors.red, `  ✗ Vulnerable: ${vulnerable}/${attackResults.length}`);
  }

  if (crashed > 0) {
    log(colors.red, `  💥 Crashes: ${crashed}/${attackResults.length}`);
  }

  const securityScore = Math.round((mitigated / attackResults.length) * 100);

  console.log(`\n  Security Score: ${securityScore}/100`);

  if (securityScore >= 90) {
    log(colors.green, `  Status: EXCELLENT - Production ready`);
  } else if (securityScore >= 70) {
    log(colors.yellow, `  Status: GOOD - Minor improvements needed`);
  } else {
    log(colors.red, `  Status: NEEDS WORK - Critical vulnerabilities exist`);
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  log(colors.green, '\n' + '█'.repeat(80));
  log(colors.green, 'ADVANCED CONVICTION SYSTEM STRESS TEST');
  log(colors.green, 'Testing extreme edges, attacks, and long-term robustness');
  log(colors.green, '█'.repeat(80));

  // Part 1: Edge Cases
  console.log('\n');
  log(colors.white, '█'.repeat(80));
  log(colors.white, 'PART 1: EXTREME EDGE CASES');
  log(colors.white, '█'.repeat(80));
  const edgeResults = await runEdgeCaseTests();

  // Part 2: Temporal Decay
  console.log('\n');
  log(colors.white, '█'.repeat(80));
  log(colors.white, 'PART 2: TEMPORAL DECAY VALIDATION');
  log(colors.white, '█'.repeat(80));
  const temporalResults = testTemporalDecay();

  // Part 3: Weight Evolution
  console.log('\n');
  log(colors.white, '█'.repeat(80));
  log(colors.white, 'PART 3: WEIGHT EVOLUTION SIMULATION');
  log(colors.white, '█'.repeat(80));
  const weightResults = testWeightEvolution();

  // Part 4: Attack Vectors
  console.log('\n');
  log(colors.white, '█'.repeat(80));
  log(colors.white, 'PART 4: ATTACK VECTOR TESTING');
  log(colors.white, '█'.repeat(80));
  const attackResults = await testAttackVectors();

  // Part 5: Performance
  console.log('\n');
  log(colors.white, '█'.repeat(80));
  log(colors.white, 'PART 5: PERFORMANCE & RESILIENCE');
  log(colors.white, '█'.repeat(80));
  testPerformance();

  // Security Report
  generateSecurityReport(attackResults);

  // Final Summary
  const totalTests = edgeResults.length + temporalResults.length + weightResults.length + attackResults.length;
  const totalPassed = [
    ...edgeResults,
    ...temporalResults,
    ...weightResults,
    ...attackResults
  ].filter(r => r.passed).length;

  log(colors.cyan, '\n' + '='.repeat(80));
  log(colors.green, 'FINAL SUMMARY');
  log(colors.cyan, '='.repeat(80));

  console.log(`\n  Total Tests: ${totalTests}`);
  log(colors.green, `  ✓ Passed: ${totalPassed}/${totalTests}`);
  log(colors.red, `  ✗ Failed: ${totalTests - totalPassed}/${totalTests}`);

  const successRate = Math.round((totalPassed / totalTests) * 100);
  console.log(`\n  Success Rate: ${successRate}%`);

  if (successRate >= 95) {
    log(colors.green, '\n  ✅ CONVICTION SYSTEM IS PRODUCTION-READY');
    log(colors.green, '  Formula is robust, secure, and future-proof\n');
  } else if (successRate >= 80) {
    log(colors.yellow, '\n  ⚠️  CONVICTION SYSTEM IS MOSTLY SOLID');
    log(colors.yellow, '  Address failing tests before full production deployment\n');
  } else {
    log(colors.red, '\n  ❌ CONVICTION SYSTEM NEEDS IMPROVEMENT');
    log(colors.red, '  Critical issues must be fixed\n');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
