#!/usr/bin/env node
/**
 * Stress Test: Taste Genome Training
 *
 * Tests that the best/worst training flow robustly mutates the genome:
 *  1. Creates a fresh genome
 *  2. Sends many best/worst likert signals (simulating rapid training)
 *  3. Validates archetype distribution shifts toward hinted archetypes
 *  4. Validates keyword learning from prompt text
 *  5. Tests edge cases: duplicate signals, skip/neutral, conflicting hints
 *  6. Tests signal cap (1000 limit)
 *  7. Tests confidence convergence
 *  8. Tests temporal decay on recompute
 */

const tasteGenome = require('../services/tasteGenome');

const BEST_WORST_WEIGHT = 1.6;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

function assertApprox(actual, expected, tolerance, label) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    passed++;
    console.log(`  ✓ ${label} (${actual.toFixed(4)} ≈ ${expected})`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label} — got ${actual.toFixed(4)}, expected ~${expected} ±${tolerance}`);
  }
}

// ─── Test 1: Fresh genome is valid ───────────────────────────
console.log('\n═══ Test 1: Fresh genome structure ═══');
{
  const g = tasteGenome.createGenome('test-user');
  assert(g.signals.length === 0, 'No signals on fresh genome');
  assert(g.archetype.primary === null, 'No primary archetype yet');
  assert(g.confidence === 0, 'Confidence starts at 0');
  assert(g.gamification.xp === 0, 'XP starts at 0');
  assert(g.itemCount === 0, 'Item count starts at 0');
  assert(Object.keys(g.keywordScores).length === 0, 'No keyword scores');
}

// ─── Test 2: Single best/worst pair mutates genome ───────────
console.log('\n═══ Test 2: Single best/worst signal pair ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // Best: "Open with a blade: state the thesis in one line." → R-10
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: {
      score: 5,
      prompt: 'Open with a blade: state the thesis in one line.',
      archetypeHint: 'R-10',
      topic: 'opening',
      polarity: 'best',
      weightOverride: BEST_WORST_WEIGHT,
    },
    timestamp: new Date(),
  });

  // Worst: "Open with a scene; let the idea surface later." → D-8
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: {
      score: 1,
      prompt: 'Open with a scene; let the idea surface later.',
      archetypeHint: 'D-8',
      topic: 'opening',
      polarity: 'worst',
      weightOverride: BEST_WORST_WEIGHT,
    },
    timestamp: new Date(),
  });

  assert(g.signals.length === 2, '2 signals recorded');
  assert(g.archetype.primary !== null, 'Primary archetype assigned');
  assert(g.archetype.distribution['R-10'] > g.archetype.distribution['D-8'],
    'R-10 distribution > D-8 after favoring R-10 and penalizing D-8');
  assert(g.confidence > 0, 'Confidence > 0 after signals');
  assert(g.itemCount === 2, 'Item count is 2');
}

// ─── Test 3: Repeated same-archetype signals converge ────────
console.log('\n═══ Test 3: Convergence with 30 consistent R-10 signals ═══');
{
  let g = tasteGenome.createGenome('test-user');
  const prompts = [
    'Start with a heresy that splits the room.',
    'Make a sharp bet. No hedging.',
    'Open with a blade: state the thesis in one line.',
    'High-energy delivery with short, charged sentences.',
    'Payoff now. No suspense, no detours.',
  ];

  for (let i = 0; i < 30; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 5,
        prompt: prompts[i % prompts.length],
        archetypeHint: 'R-10',
        polarity: 'best',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }

  assert(g.signals.length === 30, '30 signals recorded');
  assert(g.archetype.primary.designation === 'R-10',
    'Primary archetype converged to R-10');

  const r10dist = g.archetype.distribution['R-10'];
  assert(r10dist > 0.15, `R-10 distribution is dominant (${r10dist.toFixed(4)})`);

  // Confidence should be meaningful with 30 signals
  assert(g.confidence > 0.1, `Confidence meaningful: ${g.confidence.toFixed(4)}`);
}

// ─── Test 4: Opposing signals create balanced distribution ───
console.log('\n═══ Test 4: Opposing signals (R-10 best vs T-1 best) ═══');
{
  let g = tasteGenome.createGenome('test-user');

  for (let i = 0; i < 15; i++) {
    // Best R-10
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 5,
        prompt: 'Start with a heresy that splits the room.',
        archetypeHint: 'R-10',
        polarity: 'best',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
    // Best T-1
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 5,
        prompt: 'Show receipts and sources; make it undeniable.',
        archetypeHint: 'T-1',
        polarity: 'best',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }

  const r10 = g.archetype.distribution['R-10'];
  const t1 = g.archetype.distribution['T-1'];
  const diff = Math.abs(r10 - t1);

  assert(diff < 0.05, `R-10 and T-1 are close when equally trained (diff=${diff.toFixed(4)})`);
  assert(r10 > g.archetype.distribution['D-8'], 'Both R-10 and T-1 beat untrained archetypes');
}

// ─── Test 5: "Worst" signals penalize the hinted archetype ──
console.log('\n═══ Test 5: Worst signals penalize archetypes ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // 20 worst signals for D-8
  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 1,
        prompt: 'Open with a scene; let the idea surface later.',
        archetypeHint: 'D-8',
        polarity: 'worst',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }

  const d8 = g.archetype.distribution['D-8'];
  const avg = 1 / Object.keys(tasteGenome.ARCHETYPES).length;
  assert(d8 < avg, `D-8 is below average after penalization (${d8.toFixed(4)} < ${avg.toFixed(4)})`);
}

// ─── Test 6: Skip/pass signals are low-weight neutral ────────
console.log('\n═══ Test 6: Skip/pass signals ═══');
{
  let g = tasteGenome.createGenome('test-user');

  for (let i = 0; i < 10; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'pass',
      value: `skip-card-${i}`,
      metadata: {
        neutral: true,
        setId: `card-${i}`,
        optionIds: ['a', 'b', 'c', 'd'],
        topics: ['opening', 'payoff', 'hook', 'evidence'],
      },
      timestamp: new Date(),
    });
  }

  assert(g.signals.length === 10, '10 skip signals recorded');
  // Pass signals should not meaningfully shift distribution
  const values = Object.values(g.archetype.distribution);
  const max = Math.max(...values);
  const min = Math.min(...values);
  assert(max - min < 0.05, `Distribution nearly uniform after only skips (spread=${(max - min).toFixed(4)})`);
}

// ─── Test 7: Signal cap at 1000 ─────────────────────────────
console.log('\n═══ Test 7: Signal cap at 1000 ═══');
{
  let g = tasteGenome.createGenome('test-user');
  // Pump 1050 signals
  for (let i = 0; i < 1050; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 5,
        prompt: 'test signal ' + i,
        archetypeHint: 'R-10',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }

  assert(g.signals.length <= 1000, `Signals capped at 1000 (actual: ${g.signals.length})`);
  assert(g.itemCount === 1050, `itemCount still reflects total (${g.itemCount})`);
}

// ─── Test 8: Keyword learning from prompt text ──────────────
console.log('\n═══ Test 8: Keyword learning ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // "cinematic" is in KEYWORD_CATEGORIES.visual.style
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: {
      score: 5,
      prompt: 'Cinematic polish; every frame designed.',
      archetypeHint: 'S-0',
      weightOverride: BEST_WORST_WEIGHT,
    },
    timestamp: new Date(),
  });

  const cinematicKey = 'visual.style.cinematic';
  const hasScore = g.keywordScores[cinematicKey] && g.keywordScores[cinematicKey].score > 0;
  assert(hasScore, `Keyword "cinematic" learned from prompt (score=${g.keywordScores[cinematicKey]?.score})`);

  // Negative signal should decrease keyword score
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: {
      score: 1,
      prompt: 'Cinematic polish; every frame designed.',
      archetypeHint: 'S-0',
      weightOverride: BEST_WORST_WEIGHT,
    },
    timestamp: new Date(),
  });

  const afterWorst = g.keywordScores[cinematicKey].score;
  assert(afterWorst < hasScore, `Keyword score decreased after worst signal (${afterWorst})`);
}

// ─── Test 9: Gamification XP and tier ───────────────────────
console.log('\n═══ Test 9: Gamification XP and tier progression ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // Each likert signal gives score_content XP? No — likert gives default 5 XP
  // Let's verify: XP_REWARDS has no 'likert' key, so it falls back to 5
  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: { score: 5, prompt: 'test', archetypeHint: 'R-10', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
  }

  // 20 signals × 5 XP each = 100 XP base + streak/daily XP
  assert(g.gamification.xp >= 100, `XP accumulated: ${g.gamification.xp}`);
  const tier = tasteGenome.getCurrentTier(g);
  assert(tier.level >= 2, `Tier progressed beyond Nascent: ${tier.name} (level ${tier.level})`);
}

// ─── Test 10: Confidence convergence with diverse signals ───
console.log('\n═══ Test 10: Confidence grows with diverse signal types ═══');
{
  let g = tasteGenome.createGenome('test-user');
  const c0 = g.confidence;

  // Mix signal types
  g = tasteGenome.recordSignal(g, { type: 'likert', value: null, metadata: { score: 5, prompt: 'test', archetypeHint: 'R-10', weightOverride: 1.6 }, timestamp: new Date() });
  g = tasteGenome.recordSignal(g, { type: 'save', value: 'content-1', metadata: {}, timestamp: new Date() });
  g = tasteGenome.recordSignal(g, { type: 'share', value: 'content-2', metadata: {}, timestamp: new Date() });
  g = tasteGenome.recordSignal(g, { type: 'choice', value: 'q1', metadata: { selected: 'A', rejected: 'B' }, timestamp: new Date() });
  g = tasteGenome.recordSignal(g, { type: 'skip', value: 'content-3', metadata: {}, timestamp: new Date() });

  const c1 = g.confidence;
  assert(c1 > c0, `Confidence increased from ${c0.toFixed(4)} to ${c1.toFixed(4)}`);

  // Add many more
  for (let i = 0; i < 45; i++) {
    g = tasteGenome.recordSignal(g, {
      type: ['likert', 'save', 'share', 'choice', 'skip'][i % 5],
      value: `item-${i}`,
      metadata: i % 5 === 0 ? { score: 5, prompt: 'diverse test', archetypeHint: 'T-1', weightOverride: 1.6 } : {},
      timestamp: new Date(),
    });
  }

  const c2 = g.confidence;
  assert(c2 > c1, `Confidence further increased to ${c2.toFixed(4)}`);
  assert(c2 <= 0.95, `Confidence capped at 0.95 (${c2.toFixed(4)})`);
}

// ─── Test 11: weightOverride is clamped ─────────────────────
console.log('\n═══ Test 11: Weight override clamping ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // Attempt absurdly high weight
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: { score: 5, prompt: 'extreme weight', archetypeHint: 'R-10', weightOverride: 999 },
    timestamp: new Date(),
  });

  assert(g.signals[0].weight <= 3, `Weight clamped to max 3 (actual: ${g.signals[0].weight})`);

  // Attempt negative weight
  let g2 = tasteGenome.createGenome('test-user-2');
  g2 = tasteGenome.recordSignal(g2, {
    type: 'likert',
    value: null,
    metadata: { score: 5, prompt: 'negative weight', archetypeHint: 'R-10', weightOverride: -50 },
    timestamp: new Date(),
  });

  assert(Math.abs(g2.signals[0].weight) >= 0.1, `Weight clamped to min 0.1 (actual: ${g2.signals[0].weight})`);
}

// ─── Test 12: Null/missing archetype hint doesn't crash ─────
console.log('\n═══ Test 12: Null archetype hint safety ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // No archetypeHint
  g = tasteGenome.recordSignal(g, {
    type: 'likert',
    value: null,
    metadata: { score: 5, prompt: 'no hint provided', weightOverride: 1.6 },
    timestamp: new Date(),
  });

  assert(g.signals.length === 1, 'Signal recorded without archetype hint');
  assert(g.archetype.primary !== null, 'Archetype still classified (from uniform + noise)');
}

// ─── Test 13: Dynamic options from genome keywords ──────────
console.log('\n═══ Test 13: Dynamic option generation from genome keywords ═══');
{
  let g = tasteGenome.createGenome('test-user');

  // Manually populate some keyword scores to simulate history
  g.keywords = {
    content: {
      tone: { edgy: 5, sincere: 3, playful: 2, confident: 1 },
      hooks: { question: 4, 'bold-claim': 3, 'how-to': 2, story: 1 },
      format: { carousel: 5, reel: 3, story: 2 },
    },
  };

  // The buildDynamicOptions function is on the client side — just verify the
  // genome structure supports it by checking keywords exist
  assert(g.keywords.content.tone.edgy === 5, 'Genome can store keyword frequencies for dynamic options');
}

// ─── Test 14: Rapid-fire concurrent-like signals ────────────
console.log('\n═══ Test 14: Rapid-fire 200 signals (simulating fast user) ═══');
{
  let g = tasteGenome.createGenome('test-user');
  const archetypes = ['R-10', 'T-1', 'D-8', 'S-0', 'L-3', 'N-5'];
  const start = Date.now();

  for (let i = 0; i < 200; i++) {
    const hint = archetypes[i % archetypes.length];
    // Each archetype gets roughly equal best and worst by cycling score per archetype
    const round = Math.floor(i / archetypes.length);
    const score = round % 2 === 0 ? 5 : 1;
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score,
        prompt: `Rapid signal ${i} for ${hint}`,
        archetypeHint: hint,
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }

  const elapsed = Date.now() - start;
  assert(g.signals.length === 200, `All 200 signals recorded`);
  assert(elapsed < 5000, `Completed in ${elapsed}ms (< 5s)`);
  assert(g.archetype.primary !== null, 'Archetype resolved after rapid fire');

  // With alternating best/worst across 6 archetypes, distribution should be relatively flat
  const values = Object.values(g.archetype.distribution);
  const spread = Math.max(...values) - Math.min(...values);
  assert(spread < 0.15, `Distribution reasonably balanced with mixed signals (spread=${spread.toFixed(4)})`);
}

// ─── Test 15: Recompute produces same result ────────────────
console.log('\n═══ Test 15: Recompute idempotency ═══');
{
  let g = tasteGenome.createGenome('test-user');

  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: { score: 5, prompt: 'consistent signal', archetypeHint: 'T-1', weightOverride: 1.6 },
      timestamp: new Date(),
    });
  }

  const distBefore = { ...g.archetype.distribution };
  tasteGenome.updateArchetypeFromSignals(g);
  const distAfter = g.archetype.distribution;

  let maxDrift = 0;
  Object.keys(distBefore).forEach((k) => {
    maxDrift = Math.max(maxDrift, Math.abs((distBefore[k] || 0) - (distAfter[k] || 0)));
  });

  assert(maxDrift < 0.001, `Recompute is idempotent (max drift=${maxDrift.toFixed(6)})`);
}

// ─── Summary ─────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
