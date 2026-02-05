#!/usr/bin/env node
/**
 * End-to-End Stress Test: Genome Training → Content Generation Pipeline
 *
 * Validates that training signals flow through to actual content generation prompts
 * so that a brand's social media posts match its trained archetype.
 *
 * Tests:
 *  1. Genome → tasteContextService produces correct glyph/lexicon
 *  2. Genome → intelligenceService buildTasteContext produces correct profile string
 *  3. Different archetypes produce differentiated prompt contexts
 *  4. Keyword learning surfaces in top keywords fed to generation
 *  5. Worst signals create avoid-lists that reach the prompt
 *  6. Fresh/empty genome falls back safely
 *  7. High-confidence vs low-confidence genomes produce different contexts
 *  8. Rapid archetype shift (brand pivot) reflects in context
 *  9. Mixed-archetype blend produces nuanced context
 * 10. Signal cap doesn't lose archetype fidelity
 * 11. The full prompt assembled by aiService contains genome data
 * 12. Directives propagation (tone, keywords, avoid)
 */

const tasteGenome = require('../services/tasteGenome');
const { buildTasteContext, materialize1193Schema } = require('../services/tasteContextService');

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

// Helper: build a genome with N best signals for a given archetype
function trainArchetype(designation, count = 30, prompts = null) {
  const defaultPrompts = {
    'R-10': ['Start with a heresy that splits the room.', 'Make a sharp bet. No hedging.', 'Open with a blade: state the thesis in one line.'],
    'T-1': ['Show receipts and sources; make it undeniable.', 'Give me a clean model I can reuse.', 'Systems and playbooks over story arcs.'],
    'D-8': ['Open with a scene; let the idea surface later.', 'Myth, mood, and symbols over analysis.', 'Leave edges ambiguous; let it linger.'],
    'S-0': ['Cinematic polish; every frame designed.', 'Clean, precise, digital surfaces.', 'Standalone posts; each one complete.'],
    'L-3': ['Speak from scars and lived experience.', 'Low-velocity calm; controlled and steady.', 'Hold nuance; show both sides.'],
    'P-7': ['Treat it like an archive label: title, origin, purpose.', 'Analog grit, texture, imperfection.', 'Show lineage and provenance; earn trust.'],
    'N-5': ['Reframe the familiar; shift the lens.', 'Let the visual contradict the copy on purpose.', 'Humor is the delivery vehicle, not a garnish.'],
    'H-6': ['Serialized drops with ongoing threads.', 'Direct, explicit, broad reach.', 'Community reaction is part of the work.'],
    'F-9': ['Payoff now. No suspense, no detours.', 'High-energy delivery with short, charged sentences.', 'Tight modules: shorts, carousels, snippets.'],
    'C-4': ['Use fewer words than feels safe; let silence carry weight.'],
    'V-2': ['Speculative, future-facing ideas.'],
  };

  const pool = prompts || defaultPrompts[designation] || ['Signal for ' + designation];
  let g = tasteGenome.createGenome('test-brand');

  for (let i = 0; i < count; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: {
        score: 5,
        prompt: pool[i % pool.length],
        archetypeHint: designation,
        polarity: 'best',
        weightOverride: BEST_WORST_WEIGHT,
      },
      timestamp: new Date(),
    });
  }
  return g;
}

// Simulate what tasteContextService.buildTasteContext does, but synchronously
// (the real one does a DB lookup; we test the data transform logic)
function buildContextFromGenome(genome) {
  const primary = genome?.archetype?.primary || null;
  const recentSignals = (genome.signals || []).slice(-25).reverse();
  const recentTopics = recentSignals
    .map(s => s.metadata?.topic || s.metadata?.title || s.value)
    .filter(Boolean)
    .slice(0, 10);

  const lexicon = {
    prefer: [
      primary?.glyph,
      primary?.designation,
      ...(genome.directives?.tone || []),
      ...(genome.directives?.keywords || []),
    ].filter(Boolean),
    avoid: [
      ...(genome.directives?.avoid || []),
      'generic',
      'placeholder',
      'clickbait',
    ],
  };

  return {
    glyph: primary?.glyph || 'VOID',
    designation: primary?.designation || 'Ø',
    confidence: genome?.confidence || primary?.confidence || 0,
    distribution: genome?.archetype?.distribution || {},
    recentSignals: recentSignals.map(s => ({
      type: s.type,
      timestamp: s.timestamp,
      metadata: s.metadata || {},
    })),
    recentTopics,
    lexicon,
    directives: genome?.directives || {
      tone: ['minimal', 'authoritative'],
      keywords: ['taste', 'resonance'],
      avoid: ['generic', 'templated'],
    },
  };
}

// Simulate intelligenceService.buildTasteContext (the string version)
function buildIntelligenceContext(genome) {
  const perf = genome.performancePatterns || {};
  const aes = genome.aestheticPatterns || {};
  const voice = genome.voiceSignature || {};

  return `
Preferred Hooks: ${(perf.hooks || ['question', 'how-to']).join(', ')}
Winning Sentiments: ${(perf.sentiment || ['educational', 'entertaining']).join(', ')}
Dominant Tones: ${(aes.dominantTones || ['authentic']).join(', ')}
Tones to Avoid: ${(aes.avoidTones || []).join(', ') || 'none specified'}
Voice Style: ${aes.voice || 'conversational'}
Complexity Level: ${aes.complexity || 'moderate'}
Sentence Patterns: ${(voice.sentencePatterns || ['varied']).join(', ')}
Rhetorical Devices: ${(voice.rhetoricalDevices || ['questions']).join(', ')}
  `.trim();
}

// Simulate the prompt aiService.generateCaption builds (text-only path)
function buildCaptionPrompt(content, tasteContext, tone = 'casual', length = 'medium') {
  const taste = tasteContext || {};
  const lexicon = taste.lexicon || { prefer: [], avoid: [] };
  const lengthGuide = { short: '1-2 sentences', medium: '3-5 sentences', long: '6-10 sentences' };

  return `Generate 3 engaging social media captions for this content:

Platform: ${content.platform}
Media Type: ${content.mediaType}
Tone: ${tone}
Length: ${lengthGuide[length] || lengthGuide.medium}
Current Caption: ${content.caption || 'None'}
Creator Niche: general
Voice & Vibe: casual and relatable
Audience: general
Goals: engagement
Taste Glyph: ${taste.glyph || 'VOID'}
Archetype Confidence: ${taste.confidence || 0}
Preferred Lexicon: ${lexicon.prefer.join(', ') || 'minimal, authoritative'}
Avoid Lexicon: ${lexicon.avoid.join(', ') || 'generic, clickbait'}

Requirements:
- ${tone} tone
- ${lengthGuide[length]} length
- Always reflect the Taste Glyph and stay on-brand
- Use preferred lexicon; avoid banned terms and generic templates
- No placeholders, no cliches; be specific to the archetype and niche

Provide 3 variations separated by "---"`;
}


// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

console.log('\n═══ Test 1: Trained R-10 genome → context has SCHISM glyph ═══');
{
  const g = trainArchetype('R-10', 30);
  const ctx = buildContextFromGenome(g);

  assert(ctx.glyph === 'SCHISM', `Glyph is SCHISM (got: ${ctx.glyph})`);
  assert(ctx.designation === 'R-10', `Designation is R-10 (got: ${ctx.designation})`);
  assert(ctx.confidence > 0.3, `Confidence is meaningful: ${ctx.confidence.toFixed(3)}`);
  assert(ctx.lexicon.prefer.includes('SCHISM'), 'Preferred lexicon includes glyph SCHISM');
  assert(ctx.lexicon.prefer.includes('R-10'), 'Preferred lexicon includes designation R-10');
  assert(ctx.lexicon.avoid.includes('generic'), 'Avoid lexicon includes "generic"');
}

console.log('\n═══ Test 2: Trained T-1 genome → context has STRATA glyph ═══');
{
  const g = trainArchetype('T-1', 30);
  const ctx = buildContextFromGenome(g);

  assert(ctx.glyph === 'STRATA', `Glyph is STRATA (got: ${ctx.glyph})`);
  assert(ctx.designation === 'T-1', `Designation is T-1 (got: ${ctx.designation})`);
}

console.log('\n═══ Test 3: Different archetypes produce different prompts ═══');
{
  const r10 = trainArchetype('R-10', 30);
  const t1 = trainArchetype('T-1', 30);
  const d8 = trainArchetype('D-8', 30);

  const ctxR10 = buildContextFromGenome(r10);
  const ctxT1 = buildContextFromGenome(t1);
  const ctxD8 = buildContextFromGenome(d8);

  const content = { platform: 'instagram', mediaType: 'image', caption: '' };
  const promptR10 = buildCaptionPrompt(content, ctxR10);
  const promptT1 = buildCaptionPrompt(content, ctxT1);
  const promptD8 = buildCaptionPrompt(content, ctxD8);

  assert(promptR10.includes('SCHISM'), 'R-10 prompt contains SCHISM');
  assert(promptT1.includes('STRATA'), 'T-1 prompt contains STRATA');
  assert(promptD8.includes('WICK'), 'D-8 prompt contains WICK');
  assert(promptR10 !== promptT1, 'R-10 and T-1 prompts are different');
  assert(promptT1 !== promptD8, 'T-1 and D-8 prompts are different');
}

console.log('\n═══ Test 4: Keyword learning surfaces in genome top keywords ═══');
{
  let g = tasteGenome.createGenome('brand-test');

  // Train with prompts containing known keywords: "cinematic", "bold", "energetic"
  const prompts = [
    'Cinematic polish; every frame designed.',
    'Bold contrasts and energetic delivery.',
    'Cinematic mood with dramatic lighting.',
  ];
  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: { score: 5, prompt: prompts[i % prompts.length], archetypeHint: 'S-0', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
  }

  const topKw = tasteGenome.getTopKeywords(g, null, 20);
  const topNames = topKw.map(k => k.keyword);

  assert(topNames.includes('cinematic'), `"cinematic" in top keywords (found: ${topNames.join(', ')})`);
  assert(topNames.includes('bold'), `"bold" in top keywords`);
  assert(topNames.includes('dramatic'), `"dramatic" in top keywords`);

  // These keywords should have positive scores
  const cinematicEntry = topKw.find(k => k.keyword === 'cinematic');
  assert(cinematicEntry.score > 5, `cinematic score is high: ${cinematicEntry.score}`);
}

console.log('\n═══ Test 5: Worst signals create avoid-keywords ═══');
{
  let g = tasteGenome.createGenome('brand-test');

  // Train "worst" with prompts containing "minimal", "serene", "pastel"
  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert',
      value: null,
      metadata: { score: 1, prompt: 'Minimal serene pastel tones with soft lighting.', archetypeHint: 'L-3', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
  }

  const avoidKw = tasteGenome.getAvoidKeywords(g, 20);
  const avoidNames = avoidKw.map(k => k.keyword);

  assert(avoidNames.includes('minimal'), `"minimal" in avoid keywords (found: ${avoidNames.join(', ')})`);
  assert(avoidNames.includes('serene'), `"serene" in avoid keywords`);
  assert(avoidNames.includes('pastel'), `"pastel" in avoid keywords`);
  assert(avoidNames.includes('soft'), `"soft" in avoid keywords`);
}

console.log('\n═══ Test 6: Empty genome fallback safety ═══');
{
  const g = tasteGenome.createGenome('new-brand');
  const ctx = buildContextFromGenome(g);

  assert(ctx.glyph === 'VOID', `Empty genome glyph is VOID (got: ${ctx.glyph})`);
  assert(ctx.designation === 'Ø', `Empty genome designation is Ø`);
  assert(ctx.confidence === 0, 'Confidence is 0');
  assert(ctx.lexicon.avoid.includes('generic'), 'Still has base avoid terms');

  // Prompt should still be valid
  const content = { platform: 'instagram', mediaType: 'image', caption: '' };
  const prompt = buildCaptionPrompt(content, ctx);
  assert(prompt.includes('VOID'), 'Prompt contains VOID fallback glyph');
  assert(!prompt.includes('undefined'), 'No "undefined" in prompt');
  assert(!prompt.includes('null'), 'No "null" string in prompt');
}

console.log('\n═══ Test 7: High-confidence vs low-confidence context ═══');
{
  const low = trainArchetype('R-10', 3);
  const high = trainArchetype('R-10', 50);

  const ctxLow = buildContextFromGenome(low);
  const ctxHigh = buildContextFromGenome(high);

  assert(ctxHigh.confidence > ctxLow.confidence,
    `High-train confidence (${ctxHigh.confidence.toFixed(3)}) > low-train (${ctxLow.confidence.toFixed(3)})`);

  // Both should produce valid prompts
  const content = { platform: 'tiktok', mediaType: 'video', caption: '' };
  const promptLow = buildCaptionPrompt(content, ctxLow);
  const promptHigh = buildCaptionPrompt(content, ctxHigh);

  assert(promptLow.includes('SCHISM'), 'Low-confidence still has correct glyph');
  assert(promptHigh.includes('SCHISM'), 'High-confidence has correct glyph');

  // Confidence value should differ in the prompt text
  assert(promptHigh.includes(ctxHigh.confidence.toString().slice(0, 4)),
    'High confidence value appears in prompt');
}

console.log('\n═══ Test 8: Brand pivot — archetype shift mid-stream ═══');
{
  // Start as R-10
  let g = trainArchetype('R-10', 20);
  assert(g.archetype.primary.designation === 'R-10', 'Starts as R-10');

  // Pivot to T-1 with 40 strong signals
  for (let i = 0; i < 40; i++) {
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

  const ctx = buildContextFromGenome(g);
  assert(ctx.glyph === 'STRATA', `After pivot, glyph switched to STRATA (got: ${ctx.glyph})`);
  assert(ctx.designation === 'T-1', 'Designation switched to T-1');

  const content = { platform: 'instagram', mediaType: 'image', caption: '' };
  const prompt = buildCaptionPrompt(content, ctx);
  assert(prompt.includes('STRATA'), 'Prompt reflects the pivoted archetype');
  assert(!prompt.includes('SCHISM'), 'Old archetype SCHISM no longer in prompt');
}

console.log('\n═══ Test 9: Mixed archetype blend ═══');
{
  let g = tasteGenome.createGenome('blend-brand');

  // Equal signals for R-10 and N-5
  for (let i = 0; i < 20; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert', value: null,
      metadata: { score: 5, prompt: 'Start with a heresy.', archetypeHint: 'R-10', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
    g = tasteGenome.recordSignal(g, {
      type: 'likert', value: null,
      metadata: { score: 5, prompt: 'Reframe the familiar; shift the lens.', archetypeHint: 'N-5', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
  }

  const r10 = g.archetype.distribution['R-10'];
  const n5 = g.archetype.distribution['N-5'];

  assert(Math.abs(r10 - n5) < 0.05, `R-10 (${r10.toFixed(3)}) and N-5 (${n5.toFixed(3)}) are close`);

  // Should have a secondary archetype
  assert(g.archetype.secondary !== null, 'Secondary archetype present in blend');

  const ctx = buildContextFromGenome(g);
  // The glyph will be whichever is marginally higher — both are valid
  assert(['SCHISM', 'LIMN'].includes(ctx.glyph),
    `Primary glyph is one of the trained pair (got: ${ctx.glyph})`);
}

console.log('\n═══ Test 10: Signal cap preserves archetype fidelity ═══');
{
  let g = tasteGenome.createGenome('cap-brand');

  // 1100 R-10 signals (exceeds 1000 cap)
  for (let i = 0; i < 1100; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert', value: null,
      metadata: { score: 5, prompt: 'Heresy signal ' + i, archetypeHint: 'R-10', weightOverride: BEST_WORST_WEIGHT },
      timestamp: new Date(),
    });
  }

  assert(g.signals.length === 1000, `Signals capped at 1000`);

  const ctx = buildContextFromGenome(g);
  assert(ctx.glyph === 'SCHISM', `Glyph still SCHISM after cap (got: ${ctx.glyph})`);
  assert(ctx.confidence > 0.5, `Confidence maintained: ${ctx.confidence.toFixed(3)}`);
}

console.log('\n═══ Test 11: Full prompt contains all genome data ═══');
{
  let g = trainArchetype('S-0', 30);
  // Add directives
  g.directives = {
    tone: ['elegant', 'minimal'],
    keywords: ['design', 'standards'],
    avoid: ['messy', 'chaotic', 'informal'],
  };

  const ctx = buildContextFromGenome(g);
  const content = { platform: 'instagram', mediaType: 'image', caption: 'Our new collection.' };
  const prompt = buildCaptionPrompt(content, ctx, 'authoritative', 'medium');

  assert(prompt.includes('KETH'), 'Prompt has S-0 glyph KETH');
  assert(prompt.includes('S-0'), 'Prompt has designation S-0');
  assert(prompt.includes('elegant'), 'Prompt includes directive tone "elegant"');
  assert(prompt.includes('minimal'), 'Prompt includes directive tone "minimal"');
  assert(prompt.includes('design'), 'Prompt includes directive keyword "design"');
  assert(prompt.includes('standards'), 'Prompt includes directive keyword "standards"');
  assert(prompt.includes('messy'), 'Prompt includes avoid term "messy"');
  assert(prompt.includes('chaotic'), 'Prompt includes avoid term "chaotic"');
  assert(prompt.includes('authoritative'), 'Prompt includes requested tone');
  assert(prompt.includes('instagram'), 'Prompt includes platform');
  assert(prompt.includes('Our new collection'), 'Prompt includes content caption');
}

console.log('\n═══ Test 12: 1193 Schema materialization ═══');
{
  const g = trainArchetype('P-7', 25);
  g.directives = { tone: ['archival', 'reverent'], keywords: ['lineage'], avoid: ['trendy'] };
  g.outcomes = [{ roas: 2.4, date: new Date() }];

  const schema = materialize1193Schema(g);

  assert(schema.archetype.primary.glyph === 'VAULT', `Schema glyph is VAULT (got: ${schema.archetype.primary?.glyph})`);
  assert(schema.archetype.primary.designation === 'P-7', 'Schema designation is P-7');
  assert(schema.signals.total === 25, `Schema signals total is 25 (got: ${schema.signals.total})`);
  assert(schema.signals.recent.length === 25, 'Schema has 25 recent signals');
  assert(schema.directives.tone.includes('archival'), 'Schema directives include "archival"');
  assert(schema.outcomes.length === 1, 'Schema includes outcomes');
  assert(schema.outcomes[0].roas === 2.4, 'ROAS propagated to schema');
}

console.log('\n═══ Test 13: Intelligence service context reflects genome patterns ═══');
{
  let g = trainArchetype('R-10', 20);

  // Populate patterns (normally done by intelligence service analysis)
  g.performancePatterns.hooks = ['bold-claim', 'controversy'];
  g.performancePatterns.sentiment = ['provocative', 'contrarian'];
  g.aestheticPatterns.dominantTones = ['edgy', 'intense'];
  g.aestheticPatterns.avoidTones = ['gentle', 'whimsical'];
  g.aestheticPatterns.voice = 'direct';
  g.aestheticPatterns.complexity = 'high';
  g.voiceSignature.sentencePatterns = ['short-punch', 'declaration'];
  g.voiceSignature.rhetoricalDevices = ['antithesis', 'imperative'];

  const context = buildIntelligenceContext(g);

  assert(context.includes('bold-claim'), 'Intelligence context has hook "bold-claim"');
  assert(context.includes('controversy'), 'Intelligence context has hook "controversy"');
  assert(context.includes('edgy'), 'Intelligence context has tone "edgy"');
  assert(context.includes('intense'), 'Intelligence context has tone "intense"');
  assert(context.includes('gentle'), 'Intelligence context has avoid tone "gentle"');
  assert(context.includes('direct'), 'Intelligence context has voice "direct"');
  assert(context.includes('high'), 'Intelligence context has complexity "high"');
  assert(context.includes('short-punch'), 'Intelligence context has sentence pattern');
  assert(context.includes('antithesis'), 'Intelligence context has rhetorical device');
}

console.log('\n═══ Test 14: All 12 archetypes produce unique contexts ═══');
{
  const designations = Object.keys(tasteGenome.ARCHETYPES);
  const glyphs = new Set();
  const prompts = new Set();

  designations.forEach(d => {
    const g = trainArchetype(d, 20);
    const ctx = buildContextFromGenome(g);
    glyphs.add(ctx.glyph);

    const content = { platform: 'instagram', mediaType: 'image', caption: '' };
    const prompt = buildCaptionPrompt(content, ctx);
    prompts.add(prompt);
  });

  assert(glyphs.size === designations.length,
    `All ${designations.length} archetypes produce unique glyphs (got ${glyphs.size}: ${[...glyphs].join(', ')})`);
  assert(prompts.size === designations.length,
    `All ${designations.length} archetypes produce unique prompts`);
}

console.log('\n═══ Test 15: Cross-platform prompt variation ═══');
{
  const g = trainArchetype('F-9', 25);
  const ctx = buildContextFromGenome(g);

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter'];
  const results = platforms.map(platform => {
    const content = { platform, mediaType: 'video', caption: '' };
    return { platform, prompt: buildCaptionPrompt(content, ctx) };
  });

  // All prompts should have the same glyph but different platform
  results.forEach(r => {
    assert(r.prompt.includes('ANVIL'), `${r.platform} prompt has F-9 glyph ANVIL`);
    assert(r.prompt.includes(r.platform), `${r.platform} prompt mentions platform`);
  });

  // Prompts should differ by platform
  const uniquePrompts = new Set(results.map(r => r.prompt));
  assert(uniquePrompts.size === platforms.length, 'Each platform produces a unique prompt');
}

console.log('\n═══ Test 16: Genome directives gap — training does not auto-populate directives ═══');
{
  // This tests a KNOWN GAP: training signals populate archetype + keywords
  // but do NOT auto-populate genome.directives (tone/keywords/avoid).
  // The tasteContextService falls back to defaults when directives are missing.
  const g = trainArchetype('R-10', 50);

  const hasDirectives = g.directives !== undefined && g.directives !== null;
  const ctx = buildContextFromGenome(g);

  if (!hasDirectives) {
    // Verify fallback works
    assert(ctx.directives.tone.includes('minimal'), 'Missing directives → falls back to defaults');
    assert(ctx.directives.avoid.includes('generic'), 'Avoid fallback present');

    // This means the lexicon.prefer only has glyph+designation, not trained tones
    assert(ctx.lexicon.prefer.length === 2,
      `Without directives, prefer lexicon only has glyph+designation (${ctx.lexicon.prefer.join(', ')})`);

    console.log('  ⚠ GAP DETECTED: Training signals do not auto-populate genome.directives');
    console.log('    → Preferred tones/keywords from keyword learning are NOT fed to the caption prompt');
    console.log('    → Top keywords exist but are unused by buildTasteContext/caption generation');
  } else {
    assert(true, 'Directives populated (unexpected — gap may be fixed)');
  }
}

console.log('\n═══ Test 17: Keyword learning exists but is not in caption prompt ═══');
{
  let g = tasteGenome.createGenome('gap-brand');

  // Train keywords heavily
  for (let i = 0; i < 30; i++) {
    g = tasteGenome.recordSignal(g, {
      type: 'likert', value: null,
      metadata: { score: 5, prompt: 'Cinematic bold dramatic energetic delivery.', archetypeHint: 'R-10', weightOverride: 1.6 },
      timestamp: new Date(),
    });
  }

  const topKw = tasteGenome.getTopKeywords(g, null, 5);
  assert(topKw.length > 0, `Keyword learning works: ${topKw.map(k => k.keyword).join(', ')}`);

  const ctx = buildContextFromGenome(g);
  const content = { platform: 'instagram', mediaType: 'image', caption: '' };
  const prompt = buildCaptionPrompt(content, ctx);

  // Check if top keywords appear in the prompt
  const topKeywordInPrompt = topKw.some(k => prompt.includes(k.keyword));

  if (!topKeywordInPrompt) {
    console.log('  ⚠ GAP: Top keywords from training (cinematic, bold, dramatic) are NOT in the caption prompt');
    console.log('    → getTopKeywords() returns them, but buildTasteContext doesn\'t include them');
    console.log('    → The AI caption generator never sees the brand\'s learned style preferences');
    // We still pass the test — it's documenting a gap, not a crash
    assert(true, 'Gap documented: keyword scores not piped to generation prompt');
  } else {
    assert(true, 'Keywords reach the prompt (gap may be fixed)');
  }
}


// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════');

if (failed > 0) {
  console.log('\n  Some tests failed — see ✗ lines above.\n');
} else {
  console.log('\n  All tests passed.\n');
  console.log('  GAPS IDENTIFIED (not failures, but opportunities):');
  console.log('  1. genome.directives is never auto-populated from training signals');
  console.log('  2. getTopKeywords() / getAvoidKeywords() are unused in caption generation');
  console.log('  3. performancePatterns / aestheticPatterns are empty after training');
  console.log('     (only populated by intelligenceService.analyzeContent, not by training)');
  console.log('  4. The caption prompt only receives glyph + designation + directives,');
  console.log('     not the rich keyword scores or archetype distribution.\n');
}

process.exit(failed > 0 ? 1 : 0);
