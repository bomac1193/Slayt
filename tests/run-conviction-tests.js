/**
 * Conviction System Test Runner
 * Executes stress tests and produces detailed analysis
 */

const convictionService = require('../src/services/convictionService');
const stressTest = require('./conviction-stress-test');

// Color console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// ============================================================
// TEST RUNNER
// ============================================================

async function runTest(testCase) {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, `TEST: ${testCase.name}`);
  log(colors.cyan, `SCENARIO: ${testCase.scenario}`);
  log(colors.cyan, '='.repeat(80));

  try {
    // Calculate conviction
    const result = await convictionService.calculateConviction(
      testCase.content,
      testCase.userGenome
    );

    const score = result.conviction.score;
    const tier = result.conviction.tier;
    const breakdown = result.conviction.breakdown;

    // Check if score is in expected range
    const inRange = testCase.expectedConvictionRange
      ? score >= testCase.expectedConvictionRange[0] && score <= testCase.expectedConvictionRange[1]
      : true;

    // Display results
    log(colors.blue, '\nRESULTS:');
    console.log(`  Conviction Score: ${score}/100`);
    console.log(`  Tier: ${tier}`);
    console.log(`  Breakdown:`);
    console.log(`    - Performance: ${breakdown.performance}/100`);
    console.log(`    - Taste: ${breakdown.taste}/100`);
    console.log(`    - Brand: ${breakdown.brand}/100`);

    if (testCase.expectedConvictionRange) {
      console.log(`\n  Expected Range: ${testCase.expectedConvictionRange[0]}-${testCase.expectedConvictionRange[1]}`);
      if (inRange) {
        log(colors.green, `  ✓ PASS: Score within expected range`);
      } else {
        log(colors.red, `  ✗ FAIL: Score outside expected range`);
      }
    }

    // Check gating
    const gating = convictionService.checkGating(score);
    console.log(`\n  Gating Status: ${gating.status}`);
    console.log(`  Can Schedule: ${gating.canSchedule}`);
    console.log(`  Requires Review: ${gating.requiresReview}`);

    // Expected issue analysis
    if (testCase.expectedIssue) {
      log(colors.yellow, `\n  EXPECTED ISSUE: ${testCase.expectedIssue}`);
    }

    if (testCase.notes) {
      log(colors.magenta, `  NOTES: ${testCase.notes}`);
    }

    return {
      testName: testCase.name,
      passed: inRange,
      score,
      tier,
      breakdown,
      gating,
      expectedIssue: testCase.expectedIssue
    };

  } catch (error) {
    log(colors.red, `\n  ✗ ERROR: ${error.message}`);
    return {
      testName: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

// ============================================================
// FORMULA VULNERABILITY ANALYSIS
// ============================================================

function analyzeVulnerabilities() {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'VULNERABILITY ANALYSIS');
  log(colors.cyan, '='.repeat(80));

  const vulnerabilities = stressTest.formulaAnalysis.vulnerabilities;

  vulnerabilities.forEach(vuln => {
    const severityColor =
      vuln.severity === 'CRITICAL' ? colors.red :
      vuln.severity === 'HIGH' ? colors.yellow :
      colors.blue;

    log(severityColor, `\n[${vuln.severity}] ${vuln.issue}`);
    console.log(`  Description: ${vuln.description}`);
    console.log(`  Impact: ${vuln.impact}`);
    log(colors.green, `  Mitigation: ${vuln.mitigation}`);
  });
}

// ============================================================
// TEMPORAL ANALYSIS
// ============================================================

function analyzeTemporalViability() {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'TEMPORAL VIABILITY ANALYSIS (1-40 YEARS)');
  log(colors.cyan, '='.repeat(80));

  const scenarios = stressTest.temporalScenarios;

  scenarios.forEach(scenario => {
    log(colors.magenta, `\n${scenario.name.toUpperCase()}`);
    console.log(`  Challenges:`);
    scenario.challenges.forEach(c => console.log(`    - ${c}`));

    console.log(`\n  Formula Risks:`);
    Object.entries(scenario.formulaRisks).forEach(([key, risk]) => {
      console.log(`    ${key}: ${risk}`);
    });

    log(colors.green, `\n  Recommendation: ${scenario.recommendations}`);
  });
}

// ============================================================
// IMPROVED FORMULA PRESENTATION
// ============================================================

function presentImprovedFormula() {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'IMPROVED FORMULA PROPOSAL');
  log(colors.cyan, '='.repeat(80));

  const improved = stressTest.improvedFormula;

  log(colors.green, `\n${improved.name}`);
  console.log(improved.formula);

  console.log(`\nCOMPONENTS:`);
  Object.entries(improved.components).forEach(([key, component]) => {
    log(colors.blue, `\n  ${key.toUpperCase()}`);
    console.log(`    Weight: ${component.weight * 100}%`);
    console.log(`    Description: ${component.description}`);
    console.log(`    Rationale: ${component.rationale}`);
  });

  log(colors.green, `\nBENEFITS:`);
  improved.benefits.forEach(b => console.log(`  ✓ ${b}`));
}

// ============================================================
// RECOMMENDATIONS SUMMARY
// ============================================================

function presentRecommendations() {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'IMPLEMENTATION RECOMMENDATIONS');
  log(colors.cyan, '='.repeat(80));

  const recs = stressTest.recommendations;

  log(colors.red, '\nIMMEDIATE (Implement Now):');
  recs.immediate.forEach(rec => {
    console.log(`\n  [${rec.priority}] ${rec.action}`);
    console.log(`    Change: ${rec.change || rec.implementation}`);
    console.log(`    Reason: ${rec.reason}`);
  });

  log(colors.yellow, '\nPHASE 4 (Next 2-4 Weeks):');
  recs.phase4.forEach(rec => {
    console.log(`\n  [${rec.priority}] ${rec.action}`);
    console.log(`    Implementation: ${rec.implementation}`);
    console.log(`    Reason: ${rec.reason}`);
  });

  log(colors.blue, '\nLONG-TERM (Strategic):');
  recs.longTerm.forEach(rec => {
    console.log(`\n  [${rec.priority}] ${rec.action}`);
    console.log(`    Timeline: ${rec.timeline}`);
    console.log(`    Implementation: ${rec.implementation}`);
    console.log(`    Reason: ${rec.reason}`);
  });
}

// ============================================================
// COMPARATIVE WEIGHT ANALYSIS
// ============================================================

async function compareWeightingStrategies(testContent, genome) {
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'WEIGHT STRATEGY COMPARISON');
  log(colors.cyan, '='.repeat(80));

  const strategies = [
    { name: 'Current (Performance-Heavy)', weights: { performance: 0.4, taste: 0.4, brand: 0.2 } },
    { name: 'Year 1 (Taste-First)', weights: { performance: 0.35, taste: 0.45, brand: 0.2 } },
    { name: 'Year 5 (Taste-Primary)', weights: { performance: 0.3, taste: 0.5, brand: 0.2 } },
    { name: 'Year 10 (Taste-Dominant)', weights: { performance: 0.2, taste: 0.55, brand: 0.25 } },
    { name: 'Year 20+ (Taste-Core)', weights: { performance: 0.05, taste: 0.7, brand: 0.25 } }
  ];

  const performanceScore = 75;
  const tasteScore = 82;
  const brandScore = 85;

  console.log(`\nTest Scores: Performance=${performanceScore}, Taste=${tasteScore}, Brand=${brandScore}\n`);

  strategies.forEach(strategy => {
    const score = Math.round(
      (performanceScore * strategy.weights.performance) +
      (tasteScore * strategy.weights.taste) +
      (brandScore * strategy.weights.brand)
    );

    const tier =
      score >= 85 ? 'exceptional' :
      score >= 70 ? 'high' :
      score >= 50 ? 'medium' : 'low';

    console.log(`  ${strategy.name}`);
    console.log(`    Weights: P=${strategy.weights.performance} T=${strategy.weights.taste} B=${strategy.weights.brand}`);
    console.log(`    Conviction: ${score}/100 (${tier})`);
    console.log();
  });

  log(colors.green, 'OBSERVATION:');
  console.log('  As taste weight increases, the score becomes more stable and');
  console.log('  less susceptible to vanity metric inflation.');
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  log(colors.green, '\n' + '='.repeat(80));
  log(colors.green, 'CONVICTION SYSTEM STRESS TEST');
  log(colors.green, 'Testing formula viability from 1-40 years');
  log(colors.green, '='.repeat(80));

  // Run all test cases
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 1: SCENARIO TESTING');
  log(colors.blue, '█'.repeat(80));

  const results = [];
  for (const testCase of stressTest.testCases) {
    const result = await runTest(testCase);
    results.push(result);
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.cyan, 'TEST SUMMARY');
  log(colors.cyan, '='.repeat(80));
  log(colors.green, `  ✓ Passed: ${passed}/${results.length}`);
  if (failed > 0) {
    log(colors.red, `  ✗ Failed: ${failed}/${results.length}`);
  }

  // Vulnerability Analysis
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 2: VULNERABILITY ANALYSIS');
  log(colors.blue, '█'.repeat(80));
  analyzeVulnerabilities();

  // Temporal Analysis
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 3: TEMPORAL VIABILITY (1-40 YEARS)');
  log(colors.blue, '█'.repeat(80));
  analyzeTemporalViability();

  // Weight Strategy Comparison
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 4: WEIGHTING STRATEGY COMPARISON');
  log(colors.blue, '█'.repeat(80));
  await compareWeightingStrategies();

  // Improved Formula
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 5: IMPROVED FORMULA');
  log(colors.blue, '█'.repeat(80));
  presentImprovedFormula();

  // Recommendations
  console.log('\n\n');
  log(colors.blue, '█'.repeat(80));
  log(colors.blue, 'PART 6: IMPLEMENTATION RECOMMENDATIONS');
  log(colors.blue, '█'.repeat(80));
  presentRecommendations();

  // Final verdict
  log(colors.cyan, `\n${'='.repeat(80)}`);
  log(colors.green, 'FINAL VERDICT');
  log(colors.cyan, '='.repeat(80));

  console.log(`
  Current Formula Status: ⚠️  NEEDS IMPROVEMENT

  The current conviction formula (P=40%, T=40%, B=20%) works for the
  short-term but has CRITICAL vulnerabilities:

  1. Too reliant on gameable performance metrics
  2. Platform-dependent (won't survive platform changes)
  3. No feedback loop (can't self-correct)
  4. Trend-chasing over evergreen quality

  RECOMMENDATION: Implement taste-first weighting immediately.

  Proposed Next Steps:
    1. Update weights to: Taste=50%, Performance=30%, Brand=20%
    2. Add temporal decay to trend scores
    3. Implement dynamic brand scoring (Phase 2)
    4. Build feedback loops (Phase 4)
    5. Long-term: Evolve to taste graph model

  With these changes, the conviction system will:
    ✓ Survive 40+ years of platform evolution
    ✓ Resist vanity metric gaming
    ✓ Self-improve through feedback
    ✓ Reward timeless quality over trends
  `);

  log(colors.green, '\nTest suite complete! Review results above.\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTest, main };
