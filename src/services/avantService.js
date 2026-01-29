const axios = require('axios');
const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

const openaiKey = process.env.OPENAI_API_KEY;
const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const anthropicClient = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

function summarizeTaste(tasteProfile, extraContext) {
  if (!tasteProfile) return 'No taste profile; prioritise sharp, brutalist hooks.';

  const glyph = tasteProfile.glyph ? `Glyph ${tasteProfile.glyph}` : null;
  const tones = tasteProfile?.aestheticPatterns?.dominantTones || [];
  const hooks = tasteProfile?.performancePatterns?.hooks || [];
  const voice = tasteProfile?.aestheticPatterns?.voice || 'direct';
  const confidence = tasteProfile?.confidence ? `${Math.round(tasteProfile.confidence * 100)}% confidence` : '';

  const lines = [
    glyph,
    hooks.length ? `hooks: ${hooks.slice(0, 3).join(', ')}` : null,
    tones.length ? `tones: ${tones.slice(0, 3).join(', ')}` : null,
    voice ? `voice: ${voice}` : null,
    confidence,
    extraContext && typeof extraContext === 'object'
      ? Object.entries(extraContext).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      : (typeof extraContext === 'string' ? extraContext : null),
  ].filter(Boolean);

  return lines.join(' · ') || 'Direct, high-signal tone; avoid filler.';
}

function parseJsonArray(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) { /* ignore */ }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) return arr;
    } catch (_) { /* ignore */ }
  }
  return null;
}

function fallbackVariants(topic, tasteProfile, extraContext) {
  const words = topic.split(/\s+/);
  const shortTopic = words.slice(0, 6).join(' ');
  const keyWord = words[0] || topic;
  const summary = summarizeTaste(tasteProfile, extraContext);

  return [
    {
      title: `${shortTopic}: zero intro, all signal`,
      description: `Opens cold with the answer. ${summary}. No “welcome back”, just the directive.`,
      tags: [keyWord.toLowerCase(), 'direct', 'no intro', 'answer first'],
      hookType: 'statement',
      tone: 'brutalist',
      thumbnailIdea: `Single word overlay (answer) with stark contrast and glyph mark`,
      performanceScore: 74,
      tasteScore: 72,
      reasoning: 'Eliminates filler and forces a distinctive open'
    },
    {
      title: `${shortTopic}: the move no one is making`,
      description: `A sharp breakdown of ${shortTopic}. ${summary}. Precise angle, next steps only.`,
      tags: [keyWord.toLowerCase(), shortTopic.toLowerCase(), 'strategy', 'playbook'],
      hookType: 'bold-claim',
      tone: 'decisive',
      thumbnailIdea: `Brutalist text "${shortTopic}" with a single glyph mark`,
      performanceScore: 75,
      tasteScore: 70,
      reasoning: 'Bold claim + clear next action'
    },
    {
      title: `${shortTopic}: ruthless checklist`,
      description: `Concise checklist for ${shortTopic}. ${summary}.`,
      tags: [keyWord.toLowerCase(), 'checklist', 'ruthless', 'lean'],
      hookType: 'list',
      tone: 'clinical',
      thumbnailIdea: `Checklist motif with one glyph mark highlighted`,
      performanceScore: 71,
      tasteScore: 70,
      reasoning: 'Checklist format with decisive tone'
    }
  ];
}

async function callOpenAI(topic, tasteSummary, videoType, count) {
  if (!openaiClient) return null;
  const prompt = `You are an avant-garde YouTube strategist. Generate ${count} JSON items for "${topic}".
Taste: ${tasteSummary}
Video type: ${videoType}
Rules: zero fluff, brutalist clarity, hook in line 1, keep descriptions <= 2 sentences, bold glyph-like phrasing.`;

  const resp = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  });
  const text = resp.choices?.[0]?.message?.content || '';
  return parseJsonArray(text);
}

async function callGrok(variants, tasteSummary) {
  if (!grokKey || !variants?.length) return variants;
  const prompt = `Rewrite these YouTube variants to be spikier, avant-garde, and glyph/brutalist in tone. Keep JSON array shape.
Taste: ${tasteSummary}
Input JSON: ${JSON.stringify(variants).slice(0, 6000)}`;

  const resp = await axios.post(
    'https://api.x.ai/v1/chat/completions',
    {
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.95,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grokKey}`,
      },
      timeout: 15000,
    }
  );
  const text = resp.data?.choices?.[0]?.message?.content || '';
  return parseJsonArray(text) || variants;
}

async function callAnthropicPolish(variants, tasteSummary, videoType) {
  if (!anthropicClient || !variants?.length) return variants;
  const prompt = `Polish these YouTube variants to keep JSON shape, enforce brevity (titles <= 70 chars, descriptions <= 2 sentences), and preserve brutalist/glyph tone.
Taste: ${tasteSummary}
Video type: ${videoType}
Input JSON: ${JSON.stringify(variants).slice(0, 6000)}`;

  const resp = await anthropicClient.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = resp.content?.[0]?.text || '';
  return parseJsonArray(text) || variants;
}

async function generateAvantYoutube(topic, tasteProfile, options = {}) {
  const { videoType = 'standard', count = 5, tasteContext } = options;
  const tasteSummary = summarizeTaste(tasteProfile, tasteContext);

  // Step 1: primary (OpenAI)
  let variants = await callOpenAI(topic, tasteSummary, videoType, count);

  // Step 2: spike (Grok) if available
  variants = await callGrok(variants, tasteSummary);

  // Step 3: polish (Anthropic) if available
  variants = await callAnthropicPolish(variants, tasteSummary, videoType);

  if (!variants || !variants.length) {
    variants = fallbackVariants(topic, tasteProfile, tasteContext);
  }

  return {
    success: true,
    variants: variants.slice(0, count || 5),
    message: 'Avant stack',
  };
}

function hasAvantModels() {
  return !!(openaiClient || grokKey || anthropicClient);
}

module.exports = {
  generateAvantYoutube,
  hasAvantModels,
};
