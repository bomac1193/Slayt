import { useEffect, useState } from 'react';
import { Dna, Target, Activity, ListChecks } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { genomeApi } from '../lib/api';
import '../styles/subtaste-training.css';

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
      <div className="subtaste-training">
        <div className="training-container">
          <div className="training-loading">
            <div className="training-spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subtaste-training">
      <div className="training-container">
        <div className="training-header">
          <div>
            <h1 className="training-title">
              <Dna className="training-icon" />
              Subtaste / Training
            </h1>
            <p className="training-subtitle">
              High-signal inputs to sharpen your profile. Short, focused, and reaction-forward.
            </p>
            {genome?.archetype?.primary && (
              <div className="training-archetype">
                <span className="training-designation">
                  {genome.archetype.primary.designation}
                </span>
                <span className="training-glyph">
                  {genome.archetype.primary.glyph}
                </span>
                {genome.archetype.primary.sigil && (
                  <span className="training-sigil">
                    {genome.archetype.primary.sigil}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="training-stack">
          <div className="training-stack__header">
            <h3 className="training-stack__title">
              <Target className="training-icon" />
              Training Stack
            </h3>
            <span className="training-stack__hint">Best / Worst</span>
          </div>
          <p className="training-stack__desc">
            One card at a time. Pick one best and one worst, then lock to continue.
          </p>
          <div className="training-cards">
            {queue.map((card, idx) => {
              const selection = selections[card.id] || { best: null, worst: null };
              const isReady = selection.best && selection.worst;
              return (
                <div key={`${card.id}-${idx}`} className="training-card">
                  <div className="training-card__meta">
                    <span>Best / Worst</span>
                    <span>4 Options</span>
                  </div>
                  <div className="training-options">
                    {card.options.map((opt) => {
                      const isBest = selection.best === opt.id;
                      const isWorst = selection.worst === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`training-option${isBest ? ' is-best' : ''}${isWorst ? ' is-worst' : ''}`}
                        >
                          <span className="training-option__text">{opt.prompt}</span>
                          <div className="training-option__actions">
                            <button
                              type="button"
                              onClick={() => handleSelectOption(card.id, opt.id, 'best')}
                              disabled={busy}
                              className={`training-tag${isBest ? ' is-best' : ''}`}
                            >
                              Best
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectOption(card.id, opt.id, 'worst')}
                              disabled={busy}
                              className={`training-tag${isWorst ? ' is-worst' : ''}`}
                            >
                              Worst
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="training-actions">
                    <span className="training-status">
                      {isReady ? 'Ready to lock' : 'Select best and worst'}
                    </span>
                    <div className="training-actions__buttons">
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
          {trainMessage && <p className="training-message">{trainMessage}</p>}
        </section>

        {ADMIN_MODE && (
          <section className="training-admin">
            <div className="training-admin__header">
              <h3 className="training-admin__title">
                <Activity className="training-icon" />
                Admin Diagnostics
              </h3>
              {adminBusy && <span className="training-stack__hint">Working...</span>}
            </div>
            <div className="training-admin__grid">
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
              <div className="training-admin__section">
                <h4 className="training-admin__title">
                  <ListChecks className="training-icon" />
                  Archetype Distribution
                </h4>
                <div className="training-distribution">
                  {Object.entries(rawGenome.distribution).map(([designation, prob]) => (
                    <div key={designation} className="training-distribution__item">
                      <span className="training-designation">{designation}</span>
                      <span>{Math.round(prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentSignals?.length > 0 && (
              <div className="training-admin__section">
                <h4 className="training-admin__title">
                  <ListChecks className="training-icon" />
                  Recent Signals
                </h4>
                <div className="training-signal-log">
                  {recentSignals.map((sig) => (
                    <div key={sig.id || sig._id || sig.timestamp} className="training-signal-log__item">
                      <div className="training-signal-log__meta">
                        <span>{sig.type}</span>
                        <span>{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <div className="training-option__text">{sig.data?.prompt || sig.data?.selected || sig.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default TasteTraining;
