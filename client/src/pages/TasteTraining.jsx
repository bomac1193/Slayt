import { useEffect, useState } from 'react';
import { Radio, Crosshair, Activity, ListChecks } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { genomeApi } from '../lib/api';

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const BEST_WORST_POOL = [
  { id: 'bw-opening-thesis', topic: 'opening', prompt: 'Open with a blade: state the thesis in one line.', archetypeHint: 'R-10' },
  { id: 'bw-opening-scene', topic: 'opening', prompt: 'Open with a scene; let the idea surface later.', archetypeHint: 'D-8' },
  { id: 'bw-payoff-fast', topic: 'payoff', prompt: 'Payoff now. No suspense, no detours.', archetypeHint: 'F-9' },
  { id: 'bw-payoff-slow', topic: 'payoff', prompt: 'Slow burn; land the reveal at the end.', archetypeHint: 'D-8' },
  { id: 'bw-hook-contrarian', topic: 'hook', prompt: 'Start with a heresy that splits the room.', archetypeHint: 'R-10' },
  { id: 'bw-hook-curiosity', topic: 'hook', prompt: 'Start with a half-told question that pulls me in.', archetypeHint: 'N-5' },
  { id: 'bw-hook-transmission', topic: 'hook', prompt: 'Open like an intercepted transmission: fragment first, meaning later.', archetypeHint: 'D-8' },
  { id: 'bw-evidence', topic: 'evidence', prompt: 'Show receipts and sources; make it undeniable.', archetypeHint: 'T-1' },
  { id: 'bw-casefile', topic: 'casefile', prompt: 'Present it like evidence in a case file.', archetypeHint: 'T-1' },
  { id: 'bw-constraints', topic: 'constraints', prompt: 'Show the constraints up front before the content.', archetypeHint: 'T-1' },
  { id: 'bw-framework', topic: 'framework', prompt: 'Give me a clean model I can reuse.', archetypeHint: 'T-1' },
  { id: 'bw-narrative', topic: 'narrative', prompt: 'Myth, mood, and symbols over analysis.', archetypeHint: 'D-8' },
  { id: 'bw-symbol-anchor', topic: 'symbol', prompt: 'Use one object as the symbol for the entire idea.', archetypeHint: 'D-8' },
  { id: 'bw-ritual-steps', topic: 'ritual', prompt: 'Write it as a ritual instruction: steps, not commentary.', archetypeHint: 'T-1' },
  { id: 'bw-structure', topic: 'structure', prompt: 'Systems and playbooks over story arcs.', archetypeHint: 'T-1' },
  { id: 'bw-voice-lived', topic: 'authority', prompt: 'Speak from scars and lived experience.', archetypeHint: 'L-3' },
  { id: 'bw-voice-research', topic: 'authority', prompt: 'Speak from research and synthesis.', archetypeHint: 'T-1' },
  { id: 'bw-audience-insider', topic: 'audience', prompt: 'Write for insiders who already get it.', archetypeHint: 'P-7' },
  { id: 'bw-audience-bridge', topic: 'audience', prompt: 'Bridge the gap for outsiders and first-timers.', archetypeHint: 'L-3' },
  { id: 'bw-private-memo', topic: 'intimacy', prompt: 'Make it feel like a private memo, not a broadcast.', archetypeHint: 'L-3' },
  { id: 'bw-risk', topic: 'risk', prompt: 'Make a sharp bet. No hedging.', archetypeHint: 'R-10' },
  { id: 'bw-nuance', topic: 'nuance', prompt: 'Hold nuance; show both sides.', archetypeHint: 'L-3' },
  { id: 'bw-energy', topic: 'energy', prompt: 'High-energy delivery with short, charged sentences.', archetypeHint: 'F-9' },
  { id: 'bw-calm', topic: 'energy', prompt: 'Low-velocity calm; controlled and steady.', archetypeHint: 'L-3' },
  { id: 'bw-visual-polish', topic: 'visual', prompt: 'Cinematic polish; every frame designed.', archetypeHint: 'S-0' },
  { id: 'bw-visual-utility', topic: 'visual', prompt: 'Utilitarian clarity; function over flair.', archetypeHint: 'T-1' },
  { id: 'bw-format-short', topic: 'format', prompt: 'Tight modules: shorts, carousels, snippets.', archetypeHint: 'F-9' },
  { id: 'bw-format-long', topic: 'format', prompt: 'Longform essays; depth over speed.', archetypeHint: 'T-1' },
  { id: 'bw-novel-framing', topic: 'novelty', prompt: 'Reframe the familiar; shift the lens.', archetypeHint: 'N-5' },
  { id: 'bw-new-facts', topic: 'novelty', prompt: 'Bring new facts, even if the frame is plain.', archetypeHint: 'T-1' },
  { id: 'bw-archive-label', topic: 'artifact', prompt: 'Treat it like an archive label: title, origin, purpose.', archetypeHint: 'P-7' },
  { id: 'bw-texture-analog', topic: 'texture', prompt: 'Analog grit, texture, imperfection.', archetypeHint: 'P-7' },
  { id: 'bw-texture-digital', topic: 'texture', prompt: 'Clean, precise, digital surfaces.', archetypeHint: 'S-0' },
  { id: 'bw-silence', topic: 'silence', prompt: 'Use fewer words than feels safe; let silence carry weight.', archetypeHint: 'C-4' },
  { id: 'bw-contradiction', topic: 'contrast', prompt: 'Let the visual contradict the copy on purpose.', archetypeHint: 'N-5' },
  { id: 'bw-cadence-serial', topic: 'cadence', prompt: 'Serialized drops with ongoing threads.', archetypeHint: 'H-6' },
  { id: 'bw-cadence-single', topic: 'cadence', prompt: 'Standalone posts; each one complete.', archetypeHint: 'S-0' },
  { id: 'bw-signal-subtle', topic: 'signal', prompt: 'Coded, subtle signals for insiders.', archetypeHint: 'P-7' },
  { id: 'bw-signal-explicit', topic: 'signal', prompt: 'Direct, explicit, broad reach.', archetypeHint: 'H-6' },
  { id: 'bw-purpose-utility', topic: 'purpose', prompt: 'Change behavior with practical utility.', archetypeHint: 'F-9' },
  { id: 'bw-purpose-shift', topic: 'purpose', prompt: 'Change perception with a worldview shift.', archetypeHint: 'N-5' },
  { id: 'bw-ambiguity', topic: 'ambiguity', prompt: 'Leave edges ambiguous; let it linger.', archetypeHint: 'D-8' },
  { id: 'bw-precision', topic: 'precision', prompt: 'Exact wording and naming matter more than the idea.', archetypeHint: 'S-0' },
  { id: 'bw-lineage', topic: 'lineage', prompt: 'Show lineage and provenance; earn trust.', archetypeHint: 'P-7' },
  { id: 'bw-futurism', topic: 'futurism', prompt: 'Speculative, future-facing ideas.', archetypeHint: 'V-2' },
  { id: 'bw-community', topic: 'community', prompt: 'Community reaction is part of the work.', archetypeHint: 'H-6' },
  { id: 'bw-humor', topic: 'humor', prompt: 'Humor is the delivery vehicle, not a garnish.', archetypeHint: 'N-5' },
  { id: 'bw-vulnerability', topic: 'vulnerability', prompt: 'Vulnerability beats authority.', archetypeHint: 'L-3' },
  // Situational: how you'd respond in specific creative scenarios
  { id: 'bw-sit-deadline-ship', topic: 'situation-deadline', prompt: 'Two hours left: ship what you have, raw and unfinished.', archetypeHint: 'F-9' },
  { id: 'bw-sit-deadline-polish', topic: 'situation-deadline', prompt: 'Two hours left: cut scope and polish what remains.', archetypeHint: 'S-0' },
  { id: 'bw-sit-viral', topic: 'situation-viral', prompt: 'Your post went viral for the wrong reason: address it head-on.', archetypeHint: 'R-10' },
  { id: 'bw-sit-viral-ignore', topic: 'situation-viral', prompt: 'Your post went viral for the wrong reason: say nothing and move on.', archetypeHint: 'C-4' },
  { id: 'bw-sit-collab', topic: 'situation-collab', prompt: 'A collaborator rewrites your intro: accept it if it\u2019s better.', archetypeHint: 'T-1' },
  { id: 'bw-sit-collab-reject', topic: 'situation-collab', prompt: 'A collaborator rewrites your intro: reject it — voice is non-negotiable.', archetypeHint: 'S-0' },
  { id: 'bw-sit-blank', topic: 'situation-blank', prompt: 'Staring at a blank page: start with structure and fill in later.', archetypeHint: 'T-1' },
  { id: 'bw-sit-blank-flow', topic: 'situation-blank', prompt: 'Staring at a blank page: free-write until something catches.', archetypeHint: 'D-8' },
  { id: 'bw-sit-feedback', topic: 'situation-feedback', prompt: 'Harsh feedback on your best work: rethink the core assumption.', archetypeHint: 'N-5' },
  { id: 'bw-sit-feedback-hold', topic: 'situation-feedback', prompt: 'Harsh feedback on your best work: hold the line \u2014 they will catch up.', archetypeHint: 'V-2' },
  { id: 'bw-sit-trend', topic: 'situation-trend', prompt: 'A trend aligns with your niche: ride it with your own angle.', archetypeHint: 'H-6' },
  { id: 'bw-sit-trend-ignore', topic: 'situation-trend', prompt: 'A trend aligns with your niche: ignore it — trends dilute signal.', archetypeHint: 'P-7' },
  // Non-verbal / abstract preference: testing aesthetic and sensory instinct
  { id: 'bw-abs-density', topic: 'abstract-density', prompt: 'A page with only 3 words on it. Nothing else.', archetypeHint: 'C-4' },
  { id: 'bw-abs-density-full', topic: 'abstract-density', prompt: 'A page packed with 300 words. Dense and complete.', archetypeHint: 'T-1' },
  { id: 'bw-abs-tempo-fast', topic: 'abstract-tempo', prompt: 'Fast cuts, no pauses, relentless forward motion.', archetypeHint: 'F-9' },
  { id: 'bw-abs-tempo-slow', topic: 'abstract-tempo', prompt: 'Slow dissolves, held frames, deliberate silence.', archetypeHint: 'D-8' },
  { id: 'bw-abs-palette-mono', topic: 'abstract-palette', prompt: 'Monochrome with one accent color.', archetypeHint: 'C-4' },
  { id: 'bw-abs-palette-max', topic: 'abstract-palette', prompt: 'Saturated, layered, maximalist color.', archetypeHint: 'S-0' },
  { id: 'bw-abs-grid', topic: 'abstract-layout', prompt: 'Rigid grid. Every element snapped to place.', archetypeHint: 'T-1' },
  { id: 'bw-abs-organic', topic: 'abstract-layout', prompt: 'Organic scatter. Elements placed by feel.', archetypeHint: 'D-8' },
  { id: 'bw-abs-sound-sharp', topic: 'abstract-sound', prompt: 'Sharp percussive hits between sections.', archetypeHint: 'R-10' },
  { id: 'bw-abs-sound-drone', topic: 'abstract-sound', prompt: 'Continuous ambient drone underneath everything.', archetypeHint: 'D-8' },
  // Latent testing: indirect probes that reveal cognitive/creative disposition
  { id: 'bw-lat-incomplete', topic: 'latent-completion', prompt: 'An unfinished sentence is more powerful than a finished one.', archetypeHint: 'N-5' },
  { id: 'bw-lat-complete', topic: 'latent-completion', prompt: 'A finished sentence earns more trust than an open question.', archetypeHint: 'T-1' },
  { id: 'bw-lat-first-draft', topic: 'latent-revision', prompt: 'The first draft is usually closest to the truth.', archetypeHint: 'D-8' },
  { id: 'bw-lat-tenth-draft', topic: 'latent-revision', prompt: 'The tenth revision is where the real work lives.', archetypeHint: 'S-0' },
  { id: 'bw-lat-read-room', topic: 'latent-audience', prompt: 'You instinctively know what a room wants to hear.', archetypeHint: 'H-6' },
  { id: 'bw-lat-ignore-room', topic: 'latent-audience', prompt: 'You say what needs saying regardless of the room.', archetypeHint: 'R-10' },
  { id: 'bw-lat-archive', topic: 'latent-time', prompt: 'You collect and preserve more than you publish.', archetypeHint: 'P-7' },
  { id: 'bw-lat-burn', topic: 'latent-time', prompt: 'You publish and move on — old work should burn.', archetypeHint: 'F-9' },
  { id: 'bw-lat-name-first', topic: 'latent-naming', prompt: 'You name the thing before you build it.', archetypeHint: 'V-2' },
  { id: 'bw-lat-name-last', topic: 'latent-naming', prompt: 'You build the thing and the name finds itself.', archetypeHint: 'D-8' },
  { id: 'bw-lat-pattern-break', topic: 'latent-pattern', prompt: 'Breaking a pattern feels like progress.', archetypeHint: 'R-10' },
  { id: 'bw-lat-pattern-refine', topic: 'latent-pattern', prompt: 'Refining a pattern feels like mastery.', archetypeHint: 'S-0' },
  { id: 'bw-lat-alone', topic: 'latent-process', prompt: 'Your best ideas come when you\u2019re completely alone.', archetypeHint: 'C-4' },
  { id: 'bw-lat-friction', topic: 'latent-process', prompt: 'Your best ideas come from friction with other people.', archetypeHint: 'H-6' },
];

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildDynamicOptions = (g) => {
  if (!g?.keywords) return [];
  const options = [];
  const tones = Object.entries(g.keywords?.content?.tone || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tone]) => tone);
  tones.forEach((tone) => {
    const slug = slugify(tone);
    options.push({
      id: `bw-tone-${slug}`,
      topic: `tone-${slug}`,
      prompt: `Set the room to ${tone} tone.`,
      archetypeHint: null,
    });
  });
  const hooks = Object.entries(g.keywords?.content?.hooks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([hook]) => hook);
  hooks.forEach((hook) => {
    const slug = slugify(hook);
    options.push({
      id: `bw-hook-${slug}`,
      topic: `hook-${slug}`,
      prompt: `Open with a ${hook} hook.`,
      archetypeHint: null,
    });
  });
  const formats = Object.entries(g.keywords?.content?.format || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([format]) => format);
  formats.forEach((format) => {
    const slug = slugify(format);
    options.push({
      id: `bw-format-${slug}`,
      topic: `format-${slug}`,
      prompt: `Deliver it as a ${format}.`,
      archetypeHint: null,
    });
  });
  return options;
};

const getItemTopic = (item) => item?.topic || item?.id || 'misc';

const buildBestWorstPool = (g) => {
  const dynamic = buildDynamicOptions(g);
  const combined = [...dynamic, ...BEST_WORST_POOL];
  const seenIds = new Set();
  return shuffleArray(combined.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  }));
};

const pickUniqueByTopic = (items, count, usedTopics) => {
  const picks = [];
  for (const item of items) {
    const topic = item.topic;
    if (usedTopics.has(topic)) continue;
    usedTopics.add(topic);
    picks.push(item);
    if (picks.length >= count) break;
  }
  return picks;
};

const OPTIONS_PER_CARD = 4;
const QUEUE_SIZE = 1;
const BEST_WORST_WEIGHT = 1.6;

function TasteTraining() {
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const activeFolioId = useAppStore((state) => state.activeFolioId);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true';

  const [genome, setGenome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainMessage, setTrainMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState([]);
  const [rawGenome, setRawGenome] = useState(null);
  const [recentSignals, setRecentSignals] = useState([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [askedIds, setAskedIds] = useState(new Set());
  const [askedTopics, setAskedTopics] = useState(new Set());
  const [selections, setSelections] = useState({});

  useEffect(() => {
    loadGenome({ resetAsked: true });
  }, [currentProfileId]);

  const loadGenome = async ({ resetAsked = false, skipQueue = false } = {}) => {
    setLoading(true);
    try {
      const result = await genomeApi.get(currentProfileId || null);
      if (result.hasGenome) {
        setGenome(result.genome);
        const nextAskedIds = resetAsked ? new Set() : askedIds;
        const nextAskedTopics = resetAsked ? new Set() : askedTopics;
        if (resetAsked) {
          setAskedIds(nextAskedIds);
          setAskedTopics(nextAskedTopics);
        }
        if (!skipQueue) {
          setQueue(buildNextQueue(result.genome, nextAskedIds, nextAskedTopics));
        }
        if (ADMIN_MODE) {
          fetchRaw();
        }
        return result.genome;
      }
    } catch (error) {
      console.error('Failed to load genome:', error);
      return null;
    } finally {
      setLoading(false);
    }
    return null;
  };

  const buildNextQueue = (g, askedIdSet = askedIds, askedTopicSet = askedTopics) => {
    const pool = buildBestWorstPool(g).map((option) => ({
      ...option,
      topic: getItemTopic(option),
    }));

    let available = pool.filter((option) => !askedIdSet.has(option.id));
    if (available.length < OPTIONS_PER_CARD) {
      available = pool;
    }

    const queueItems = [];
    const usedTopics = new Set([...askedTopicSet]);
    let remaining = [...available];

    for (let i = 0; i < QUEUE_SIZE && remaining.length >= OPTIONS_PER_CARD; i += 1) {
      const shuffled = shuffleArray(remaining);
      const picks = pickUniqueByTopic(shuffled, OPTIONS_PER_CARD, usedTopics);

      if (picks.length < OPTIONS_PER_CARD) {
        for (const item of shuffled) {
          if (picks.includes(item)) continue;
          picks.push(item);
          if (picks.length >= OPTIONS_PER_CARD) break;
        }
      }

      if (picks.length < OPTIONS_PER_CARD) break;

      const pickIds = new Set(picks.map((item) => item.id));
      remaining = remaining.filter((item) => !pickIds.has(item.id));
      queueItems.push({
        id: `bw-${picks.map((item) => item.id).join('-')}-${Math.random().toString(36).slice(2, 7)}`,
        options: picks,
      });
    }

    return queueItems;
  };

  const handleSelectOption = (cardId, optionId, kind) => {
    if (busy) return;
    setSelections((prev) => {
      const current = prev[cardId] || { best: null, worst: null };
      const next = { ...current };
      if (kind === 'best') {
        next.best = current.best === optionId ? null : optionId;
        if (next.best === next.worst) next.worst = null;
      } else {
        next.worst = current.worst === optionId ? null : optionId;
        if (next.worst === next.best) next.best = null;
      }
      return { ...prev, [cardId]: next };
    });
  };

  const handleSubmitBestWorst = async (card) => {
    const selection = selections[card.id];
    if (!selection?.best || !selection?.worst) return;

    const bestOption = card.options.find((opt) => opt.id === selection.best);
    const worstOption = card.options.find((opt) => opt.id === selection.worst);
    if (!bestOption || !worstOption) return;

    setBusy(true);
    setTrainMessage('Locking in your signal...');
    try {
      await genomeApi.signal(
        'likert',
        null,
        {
          score: 5,
          prompt: bestOption.prompt,
          archetypeHint: bestOption.archetypeHint,
          topic: bestOption.topic,
          optionId: bestOption.id,
          setId: card.id,
          polarity: 'best',
          weightOverride: BEST_WORST_WEIGHT,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      await genomeApi.signal(
        'likert',
        null,
        {
          score: 1,
          prompt: worstOption.prompt,
          archetypeHint: worstOption.archetypeHint,
          topic: worstOption.topic,
          optionId: worstOption.id,
          setId: card.id,
          polarity: 'worst',
          weightOverride: BEST_WORST_WEIGHT,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      setTrainMessage(`Logged: best "${bestOption.prompt}" / worst "${worstOption.prompt}".`);
      const nextGenome = await loadGenome({ skipQueue: true });
      const nextAskedIds = new Set(askedIds);
      const nextAskedTopics = new Set(askedTopics);
      card.options.forEach((opt) => {
        nextAskedIds.add(opt.id);
        nextAskedTopics.add(opt.topic);
      });
      setAskedIds(nextAskedIds);
      setAskedTopics(nextAskedTopics);
      setSelections((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
      setQueue(buildNextQueue(nextGenome || genome, nextAskedIds, nextAskedTopics));
    } catch (error) {
      console.error('Failed to log best/worst signal:', error);
      setTrainMessage('Could not record this signal. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSkipCard = async (card) => {
    if (busy) return;
    setBusy(true);
    setTrainMessage('Skipping this card...');
    try {
      await genomeApi.signal(
        'pass',
        card.id,
        {
          neutral: true,
          setId: card.id,
          optionIds: card.options.map((opt) => opt.id),
          topics: card.options.map((opt) => opt.topic),
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      const nextGenome = await loadGenome({ skipQueue: true });
      const nextAskedIds = new Set(askedIds);
      const nextAskedTopics = new Set(askedTopics);
      card.options.forEach((opt) => {
        nextAskedIds.add(opt.id);
        nextAskedTopics.add(opt.topic);
      });
      setAskedIds(nextAskedIds);
      setAskedTopics(nextAskedTopics);
      setSelections((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
      setQueue(buildNextQueue(nextGenome || genome, nextAskedIds, nextAskedTopics));
      setTrainMessage('Skipped. New card loaded.');
    } catch (error) {
      console.error('Failed to skip card:', error);
      setTrainMessage('Could not skip this card. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const fetchRaw = async () => {
    if (!ADMIN_MODE) return;
    try {
      const raw = await genomeApi.getRaw(currentProfileId || null);
      setRawGenome(raw);
    } catch (error) {
      console.error('Failed to load raw genome:', error);
    }
    try {
      const signals = await genomeApi.getSignals(currentProfileId || null, 20);
      setRecentSignals(signals.signals || []);
    } catch (error) {
      console.error('Failed to load signals:', error);
    }
  };

  const handleRecompute = async () => {
    if (!ADMIN_MODE) return;
    setAdminBusy(true);
    try {
      await genomeApi.recompute(currentProfileId || null);
      await loadGenome();
      await fetchRaw();
    } catch (error) {
      console.error('Failed to recompute genome:', error);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSeed = async () => {
    if (!ADMIN_MODE) return;
    setAdminBusy(true);
    const seeds = [
      { type: 'choice', id: 'seed-contrarian', metadata: { choice: 'a', selected: 'Contrarian', rejected: 'Consensus' } },
      { type: 'choice', id: 'seed-polish', metadata: { choice: 'b', selected: 'Ship fast', rejected: 'Polish' } },
      { type: 'likert', id: 'seed-likert-intensity', metadata: { score: 4, prompt: 'I prefer intense delivery', archetypeHint: 'R-10' } },
    ];
    try {
      for (const seed of seeds) {
        await genomeApi.signal(seed.type, seed.id, { ...seed.metadata, folioId: activeFolioId || undefined, projectId: activeProjectId || undefined }, currentProfileId || null);
      }
      await loadGenome();
      await fetchRaw();
    } catch (error) {
      console.error('Failed to seed signals:', error);
    } finally {
      setAdminBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 font-display uppercase tracking-widest">
          <Radio className="w-7 h-7 text-dark-300" />
          Subtaste · Training
        </h1>
        <p className="text-dark-400 mt-1">
          High-signal inputs to sharpen your profile. Short, focused, and reaction-forward.
        </p>
        {genome?.archetype?.primary && (
          <div className="mt-2 flex items-center gap-3">
            <span className="px-3 py-1 bg-dark-900 border border-dark-700 rounded-sm text-xs text-dark-100 font-mono tracking-[0.3em] uppercase">
              {genome.archetype.primary.designation}
            </span>
            <span className="text-lg text-white font-black uppercase tracking-[0.08em]">
              {genome.archetype.primary.glyph}
            </span>
            {genome.archetype.primary.sigil && (
              <span className="text-xs text-dark-300 font-mono uppercase tracking-[0.14em]">
                {genome.archetype.primary.sigil}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Training Stack */}
      <section className="bg-dark-900 rounded-lg border border-dark-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-white flex items-center gap-2 uppercase tracking-widest">
            <Crosshair className="w-4 h-4 text-dark-300" />
            Training Stack
          </h3>
          <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.16em]">Best / Worst</span>
        </div>
        <div className="mb-6">
          <p className="text-sm text-dark-300 tracking-wide">Pick your best and worst from these cards, then lock to continue.</p>
        </div>

        <div className="grid gap-4">
          {queue.map((card, idx) => {
            const selection = selections[card.id] || { best: null, worst: null };
            const isReady = selection.best && selection.worst;
            return (
              <div key={`${card.id}-${idx}`} className="bg-dark-800 border border-dark-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.16em]">Best / Worst</span>
                  <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.16em]">4 Options</span>
                </div>

                <div className="flex flex-col gap-3">
                  {card.options.map((opt) => {
                    const isBest = selection.best === opt.id;
                    const isWorst = selection.worst === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between gap-4 p-3 rounded-lg border transition-all ${
                          isBest
                            ? 'border-accent-purple bg-accent-purple/10'
                            : isWorst
                              ? 'border-red-600 bg-red-600/10'
                              : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                        }`}
                      >
                        <span className="text-sm text-dark-100">{opt.prompt}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectOption(card.id, opt.id, 'best')}
                            disabled={busy}
                            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wide border transition-all ${
                              isBest
                                ? 'border-accent-purple text-white bg-accent-purple/20'
                                : 'border-dark-600 text-dark-400 hover:border-dark-500 hover:text-dark-200'
                            }`}
                          >
                            Best
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectOption(card.id, opt.id, 'worst')}
                            disabled={busy}
                            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wide border transition-all ${
                              isWorst
                                ? 'border-red-600 text-white bg-red-600/20'
                                : 'border-dark-600 text-dark-400 hover:border-dark-500 hover:text-dark-200'
                            }`}
                          >
                            Worst
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.14em]">
                    {isReady ? 'Ready to lock' : 'Select best and worst'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSkipCard(card)}
                      disabled={busy}
                      className="btn-secondary"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitBestWorst(card)}
                      disabled={!isReady || busy}
                      className="btn-primary"
                    >
                      Lock
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {trainMessage && <p className="text-xs text-dark-300 mt-4">{trainMessage}</p>}
      </section>

      {/* Admin Diagnostics */}
      {ADMIN_MODE && (
        <section className="bg-dark-900 rounded-lg border border-dark-700 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-[0.12em]">
              <Activity className="w-4 h-4 text-dark-300" />
              Admin Diagnostics
            </h3>
            {adminBusy && <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.16em]">Working...</span>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSeed}
              disabled={adminBusy}
              className="btn-secondary"
            >
              Seed signals
            </button>
            <button
              type="button"
              onClick={handleRecompute}
              disabled={adminBusy}
              className="btn-secondary"
            >
              Recompute genome
            </button>
            <button
              type="button"
              onClick={fetchRaw}
              disabled={adminBusy}
              className="btn-secondary"
            >
              Refresh raw view
            </button>
          </div>

          {rawGenome?.distribution && (
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-[0.12em] mb-3">
                <ListChecks className="w-4 h-4 text-dark-300" />
                Archetype Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(rawGenome.distribution).map(([designation, prob]) => (
                  <div key={designation} className="rounded border border-dark-700 p-2 bg-dark-800 text-sm text-dark-200 flex items-center justify-between">
                    <span className="font-mono tracking-[0.12em]">{designation}</span>
                    <span className="text-white font-semibold">{Math.round(prob * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentSignals?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-[0.12em] mb-3">
                <ListChecks className="w-4 h-4 text-dark-300" />
                Recent Signals
              </h4>
              <div className="grid gap-3">
                {recentSignals.map((sig) => (
                  <div key={sig.id || sig._id || sig.timestamp} className="rounded-lg border border-dark-700 p-3 bg-dark-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.14em]">{sig.type}</span>
                      <span className="text-[11px] text-dark-500 font-mono">{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-sm text-dark-100">{sig.data?.prompt || sig.data?.selected || sig.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default TasteTraining;
