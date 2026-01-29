import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { genomeApi } from '../lib/api';
import { Dna, Target, Zap, Activity, ListChecks } from 'lucide-react';

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const LIKERT_POOL = [
  { id: 'risk-bold', prompt: 'I prefer bold, contrarian takes over consensus summaries.', archetypeHint: 'R-10' },
  { id: 'story-mood', prompt: 'I’m drawn to narrative and mood over straight how-to instructions.', archetypeHint: 'D-8' },
  { id: 'evidence', prompt: 'Data, references, and receipts make me trust the content.', archetypeHint: 'T-1' },
  { id: 'craft', prompt: 'I care about aesthetic craft and polish more than speed.', archetypeHint: 'S-0' },
  { id: 'playful', prompt: 'I enjoy playful, surprising twists more than straightforward delivery.', archetypeHint: 'N-5' },
  { id: 'mentor', prompt: 'I like calm, mentor energy more than hype or edge.', archetypeHint: 'L-3' },
  { id: 'lineage', prompt: 'I value references to lineage, influence, and history.', archetypeHint: 'P-7' },
  { id: 'speed', prompt: 'I prize speed to publish over perfect polish.', archetypeHint: 'F-9' },
  { id: 'austerity', prompt: 'I prefer austere, brutalist visuals to colourful maximalism.', archetypeHint: 'C-4' },
  { id: 'experiments', prompt: 'I will try odd formats if the idea feels alive, even if it may flop.', archetypeHint: 'V-2' },
  { id: 'precision', prompt: 'I want language to be precise and sharp, not conversational and loose.', archetypeHint: 'S-0' },
  { id: 'community', prompt: 'I value community reaction and discourse as part of the work.', archetypeHint: 'H-6' },
];

const BASE_TASTE_POOL = [
  {
    id: 'edge-vs-mentor',
    label: 'Hook style',
    a: 'Bold, contrarian hooks that polarize',
    b: 'Calm, mentor energy with gentle setups',
  },
  {
    id: 'mythic-vs-analytic',
    label: 'Narrative mode',
    a: 'Mythic storytelling, symbolism, mood',
    b: 'Analytic, data-backed, pragmatic proofs',
  },
  {
    id: 'speed-vs-depth',
    label: 'Format bias',
    a: 'Fast, punchy shorts and carousels',
    b: 'Deep-dive longform and thoughtful pacing',
  },
  {
    id: 'design-vs-report',
    label: 'Visual feel',
    a: 'High-design, cinematic visuals',
    b: 'Plain, report-style clarity',
  },
  {
    id: 'voice-vs-data',
    label: 'Tone preference',
    a: 'Personal voice, vivid anecdotes',
    b: 'Data-led, concise insights',
  },
  {
    id: 'genre-vs-cross',
    label: 'Content angle',
    a: 'Genre purist: stay in one niche',
    b: 'Cross-pollinate: mix odd combos',
  },
  {
    id: 'austerity-vs-flare',
    label: 'Visual palette',
    a: 'Monochrome, brutalist, negative space',
    b: 'Colourful, layered, maximalist',
  },
  {
    id: 'narrative-vs-system',
    label: 'Structure bias',
    a: 'Story-led arcs and characters',
    b: 'Frameworks and playbooks',
  },
];

const archetypeTasteMap = {
  'R-10': { id: 'archetype-contrarian', label: 'Contrarian vs Consensus', a: 'Break assumptions and punch holes', b: 'Balance takes and build consensus' },
  'D-8': { id: 'archetype-channel', label: 'Channel vs Direct', a: 'Vibes, symbolism, mood-led', b: 'Direct, literal, step-by-step' },
  'T-1': { id: 'archetype-architect', label: 'Systems vs Intuition', a: 'Frameworks, logic, scaffolds', b: 'Gut feel, creative intuition' },
  'P-7': { id: 'archetype-archive', label: 'Lineage vs Trend', a: 'Rooted in lineage and references', b: 'Chasing fresh trends constantly' },
  'S-0': { id: 'archetype-standard', label: 'Polish vs Speed', a: 'High polish and standard-setting', b: 'Ship fast, iterate in public' },
  'L-3': { id: 'archetype-cultivator', label: 'Mentor vs Maverick', a: 'Patient mentor energy', b: 'Maverick experimentation' },
  'N-5': { id: 'archetype-integrator', label: 'Integration vs Purity', a: 'Blend opposites and hybrids', b: 'Keep a pure, singular vibe' },
  'V-2': { id: 'archetype-omen', label: 'Early vs Mainstream', a: 'Spot early gems and edges', b: 'Stick to mainstream proof' },
  'H-6': { id: 'archetype-advocate', label: 'Advocate vs Observer', a: 'Campaigning advocacy', b: 'Neutral observation' },
  'F-9': { id: 'archetype-manifestor', label: 'Action vs Theory', a: 'Ship and execute', b: 'Theory and planning first' },
};

const pickKeywordPairs = (g) => {
  if (!g?.keywords) return [];
  const tones = Object.entries(g.keywords?.content?.tone || {})
    .sort((a, b) => b[1] - a[1])
    .map(([tone]) => tone);
  const hooks = Object.entries(g.keywords?.content?.hooks || {})
    .sort((a, b) => b[1] - a[1])
    .map(([hook]) => hook);
  const picks = [];
  if (tones.length >= 2) {
    picks.push({
      id: 'tone-pair',
      label: 'Tone preference',
      a: `Leaning toward ${tones[0]} tone`,
      b: `Leaning toward ${tones[1]} tone`,
    });
  }
  if (hooks.length >= 2) {
    picks.push({
      id: 'hook-pair',
      label: 'Hook style',
      a: `${hooks[0]} hooks`,
      b: `${hooks[1]} hooks`,
    });
  }
  return picks;
};

const buildTastePairs = (g) => {
  const base = [...BASE_TASTE_POOL];
  const archetypeId = g?.archetype?.primary?.designation;
  if (archetypeId && archetypeTasteMap[archetypeId]) {
    base.push(archetypeTasteMap[archetypeId]);
  }
  const keywordPairs = pickKeywordPairs(g);
  const combined = [...base, ...keywordPairs];
  return shuffleArray(combined);
};

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

  const trainingPool = useMemo(() => {
    // Build a mixed pool of pairs and likert items
    const pairs = buildTastePairs(genome).map((p) => ({ type: 'pair', data: p }));
    const likerts = shuffleArray(LIKERT_POOL).map((l) => ({ type: 'likert', data: l }));
    // interleave pairs and likerts
    const mixed = [];
    const maxLen = Math.max(pairs.length, likerts.length);
    for (let i = 0; i < maxLen; i++) {
      if (pairs[i]) mixed.push(pairs[i]);
      if (likerts[i]) mixed.push(likerts[i]);
    }
    return mixed;
  }, [genome]);

  useEffect(() => {
    loadGenome();
  }, [currentProfileId]);

  const loadGenome = async () => {
    setLoading(true);
    try {
      const result = await genomeApi.get(currentProfileId || null);
      if (result.hasGenome) {
        setGenome(result.genome);
        setAskedIds(new Set());
        setQueue(buildNextQueue(result.genome));
        if (ADMIN_MODE) {
          fetchRaw();
        }
      }
    } catch (error) {
      console.error('Failed to load genome:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildNextQueue = (g) => {
    const poolPairs = buildTastePairs(g).map((p) => ({ type: 'pair', data: p }));
    const poolLikerts = shuffleArray(LIKERT_POOL).map((l) => ({ type: 'likert', data: l }));

    // filter items already answered in this session
    const filteredPairs = poolPairs.filter((item) => !askedIds.has(item.data.id));
    const filteredLikerts = poolLikerts.filter((item) => !askedIds.has(item.data.id));

    let mixed = [];
    const maxLen = Math.max(filteredPairs.length, filteredLikerts.length);
    for (let i = 0; i < maxLen; i++) {
      if (filteredPairs[i]) mixed.push(filteredPairs[i]);
      if (filteredLikerts[i]) mixed.push(filteredLikerts[i]);
    }

    // If everything is exhausted, reset asked set and surface a fresh slice
    if (mixed.length === 0) {
      setAskedIds(new Set());
      mixed = poolPairs.slice(0, 2).concat(poolLikerts.slice(0, 2));
    }

    return mixed.slice(0, 4);
  };

  const handlePair = async (pair, choice) => {
    setBusy(true);
    setTrainMessage('Updating your genome…');
    const chosen = pair[choice];
    const other = pair[choice === 'a' ? 'b' : 'a'];
    try {
      await genomeApi.signal(
        'choice',
        pair.id,
        { choice, selected: chosen, rejected: other, folioId: activeFolioId || undefined, projectId: activeProjectId || undefined },
        currentProfileId || null
      );
      setTrainMessage(`Logged: "${chosen}" → genome updated.`);
      await loadGenome();
      setAskedIds((prev) => {
        const next = new Set(prev);
        next.add(pair.id);
        return next;
      });
      setQueue(buildNextQueue(genome));
    } catch (error) {
      console.error('Failed to log taste choice:', error);
      setTrainMessage('Could not record this choice. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleLikert = async (item, score) => {
    setBusy(true);
    setTrainMessage('Locking in your signal…');
    try {
      await genomeApi.signal(
        'likert',
        item.id,
        {
          score,
          prompt: item.prompt,
          archetypeHint: item.archetypeHint,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      setTrainMessage(`Logged: "${item.prompt}" (${score}/5) → genome updated.`);
      await loadGenome();
      setAskedIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      setQueue(buildNextQueue(genome));
    } catch (error) {
      console.error('Failed to log likert signal:', error);
      setTrainMessage('Could not record this signal. Try again.');
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
        <div className="animate-spin w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Dna className="w-7 h-7 text-accent-purple" />
            Subtaste · Training
          </h1>
          <p className="text-dark-400 mt-1">High-signal inputs to harden your glyph.</p>
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
      </div>

      {/* Unified Training Stack */}
      <div className="bg-dark-900 rounded-lg border border-dark-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-[0.12em] flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-purple" />
            Training Stack
          </h3>
          <span className="text-[11px] text-dark-500 font-mono uppercase tracking-[0.14em]">A/B + Likert</span>
        </div>
        <p className="text-sm text-dark-300 mb-3">
          Mixed rapid A/B and Likert signals. Answer to advance; genome updates after each input.
        </p>
        <div className="space-y-3">
          {queue.map((item, idx) => {
            if (item.type === 'pair') {
              const pair = item.data;
              return (
                <div key={`${item.type}-${pair.id}-${idx}`} className="rounded-lg border border-dark-700 bg-dark-950 p-3">
                  <p className="text-[11px] text-dark-400 uppercase tracking-[0.12em] mb-2">{pair.label}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePair(pair, 'a')}
                      disabled={busy}
                      className="p-3 rounded-md border border-dark-700 text-left text-sm text-dark-100 hover:border-accent-purple transition-colors disabled:opacity-50"
                    >
                      {pair.a}
                    </button>
                    <button
                      onClick={() => handlePair(pair, 'b')}
                      disabled={busy}
                      className="p-3 rounded-md border border-dark-700 text-left text-sm text-dark-100 hover:border-accent-purple transition-colors disabled:opacity-50"
                    >
                      {pair.b}
                    </button>
                  </div>
                </div>
              );
            }
            if (item.type === 'likert') {
              const lk = item.data;
              return (
                <div key={`${item.type}-${lk.id}-${idx}`} className="rounded-lg border border-dark-700 bg-dark-950 p-3">
                  <p className="text-sm text-dark-200 mb-2">{lk.prompt}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-dark-500 w-24 text-right uppercase tracking-[0.1em]">Disagree</span>
                    <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    defaultValue={3}
                    onMouseUp={(e) => handleLikert(lk, Number(e.currentTarget.value))}
                    onTouchEnd={(e) => handleLikert(lk, Number(e.currentTarget.value))}
                    disabled={busy}
                    className="flex-1 accent-accent-purple bg-dark-800"
                  />
                    <span className="text-[11px] text-dark-500 w-20 uppercase tracking-[0.1em]">Agree</span>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
        {trainMessage && <p className="text-xs text-dark-300 mt-3">{trainMessage}</p>}
      </div>

      {ADMIN_MODE && (
        <div className="bg-dark-900 rounded-lg border border-dark-700 p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.12em] flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-purple" />
              Admin Diagnostics
            </h3>
            {adminBusy && <span className="text-xs text-accent-purple">Working…</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSeed}
              disabled={adminBusy}
              className="px-3 py-2 rounded border border-dark-600 text-sm text-white hover:border-accent-purple"
            >
              Seed signals
            </button>
            <button
              onClick={handleRecompute}
              disabled={adminBusy}
              className="px-3 py-2 rounded border border-dark-600 text-sm text-white hover:border-accent-purple"
            >
              Recompute genome
            </button>
            <button
              onClick={fetchRaw}
              disabled={adminBusy}
              className="px-3 py-2 rounded border border-dark-600 text-sm text-white hover:border-accent-purple"
            >
              Refresh raw view
            </button>
          </div>

          {rawGenome?.distribution && (
            <div>
              <h4 className="text-xs text-dark-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-accent-purple" />
                Archetype Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(rawGenome.distribution).map(([designation, prob]) => (
                  <div key={designation} className="rounded border border-dark-700 p-2 bg-dark-950 text-sm text-dark-200 flex items-center justify-between">
                    <span className="font-mono tracking-[0.12em]">{designation}</span>
                    <span className="text-white font-semibold">{Math.round(prob * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentSignals?.length > 0 && (
            <div>
              <h4 className="text-xs text-dark-400 uppercase tracking-[0.12em] mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-accent-purple" />
                Recent Signals
              </h4>
              <div className="space-y-1 text-sm text-dark-200">
                {recentSignals.map((sig) => (
                  <div key={sig.id || sig._id || sig.timestamp} className="rounded border border-dark-700 bg-dark-950 p-2">
                    <div className="flex items-center justify-between text-xs text-dark-400">
                      <span>{sig.type}</span>
                      <span>{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ''}</span>
                    </div>
                    <div className="text-dark-100">{sig.data?.prompt || sig.data?.selected || sig.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TasteTraining;
