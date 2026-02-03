import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { genomeApi } from '../lib/api';
import {
  Dna,
  Zap,
  Lock,
  CheckCircle2,
  ChevronDown,
  Award,
  Eye,
  Shield,
  Activity,
  Crosshair,
  FileText,
  Scan,
  Fingerprint,
  CircleDot,
  Radio,
  Radiation,
  ScanLine,
  Hash,
  Disc,
  Flame,
  Trophy,
} from 'lucide-react';

// ── Bio-Glow Classified Palette ──────────────────────────────────────────────
// Soft white luminescence against dark institutional backgrounds.
// Cold bio-white glow with violet accents against dark institutional backgrounds.
const GLOW = '#d4d4d8';        // zinc-300 — primary bio-glow
const GLOW_BRIGHT = '#e4e4e7'; // zinc-200 — emphasis glow
const GLOW_DIM = '#a1a1aa';    // zinc-400 — muted glow
const VIOLET = '#8b5cf6';      // accent-purple — secondary glow
const VIOLET_TEXT = '#c4b5fd';  // violet-300 — readable violet text

// ── Archetype Icon Map — austere / institutional / classified ─────────────────
const ARCHETYPE_ICONS = {
  'S-0': Radiation,    // Standard-Bearer — radiating influence
  'T-1': ScanLine,     // System-Seer — scanning structure
  'V-2': Scan,         // Early Witness — early detection
  'L-3': Disc,         // Patient Cultivator — slow rotation
  'C-4': Crosshair,    // Essential Editor — precision targeting
  'N-5': Radio,        // Border Illuminator — cross-frequency
  'H-6': Fingerprint,  // Relentless Advocate — indelible mark
  'P-7': FileText,     // Living Archive — the dossier
  'D-8': CircleDot,    // Hollow Channel — empty center
  'F-9': Hash,         // Manifestor — building blocks
  'R-10': Zap,         // Productive Fracture — break point
  'NULL': Eye,         // Receptive Presence — pure observation
};

const ACHIEVEMENT_ICONS = {
  'first-score': Eye,
  'ten-scores': Crosshair,
  'fifty-scores': Award,
  'first-publish': Zap,
  'ten-published': Hash,
  'first-hook': Scan,
  'hook-master': Radiation,
  'streak-3': Flame,
  'streak-7': Flame,
  'streak-30': Trophy,
  'style-explorer': Radio,
  'hook-explorer': ScanLine,
  'glyph-revealed': Dna,
};

// ── Archetype Dossier — full briefing per designation ─────────────────────────
// Each entry: what the archetype is, strengths, weaknesses, content style, anti-patterns.
const ARCHETYPE_DOSSIER = {
  'S-0': {
    brief: 'The Standard-Bearer sets benchmarks. Your taste defines what quality looks like before others can articulate why. You don\'t follow trends — you establish the reference points others eventually decode.',
    strengths: ['Defining quality standards', 'Visionary taste that ages well', 'Natural authority on what "good" looks like', 'Content that becomes the template others copy'],
    weaknesses: ['Paralysis when nothing meets your standard', 'Difficulty shipping imperfect work', 'Dismissing valid work that doesn\'t match your framework'],
    contentStyle: 'High-production, reference-grade content. Manifestos, definitive guides, aesthetic mood-boards that set the tone for a space. Evergreen pieces that people bookmark and return to.',
    antiPatterns: 'Avoid reactive trend commentary, low-effort remixes, "me too" content. Short-form hot takes dilute your authority. Don\'t chase algorithms — let them chase you.',
  },
  'T-1': {
    brief: 'The System-Seer reverse-engineers excellence. You see the invisible scaffolding behind great work — the production logic, the structural decisions, the architecture that holds it together.',
    strengths: ['Deconstructing why things work', 'Building repeatable frameworks', 'Identifying patterns across domains', 'Teaching through systematic analysis'],
    weaknesses: ['Over-engineering simple problems', 'Getting lost in the blueprint without building', 'Valuing structure over soul', 'Analysis paralysis'],
    contentStyle: 'Long-form breakdowns, system maps, "how it\'s built" deep dives. Framework posts, process documentation, architectural walkthroughs. Tutorial series with layered complexity.',
    antiPatterns: 'Avoid surface-level tips, brainrot loops, and unstructured stream-of-consciousness. Don\'t rush to publish before the framework is coherent. Skip trend-surfing listicles.',
  },
  'V-2': {
    brief: 'The Early Witness has temporal vision. You found the artist at 500 plays. You sense what\'s coming before it arrives — not because you follow trends, but because you feel the pressure change.',
    strengths: ['Early signal detection', 'Prophetic taste that validates over time', 'Curating the genuinely new', 'Building audience trust through prescience'],
    weaknesses: ['Being right too soon and dismissed for it', 'Impatience with mainstream adoption curves', 'Abandoning finds once they gain traction', 'Obscurity as identity'],
    contentStyle: 'Discovery-focused curation, "heard it here first" features, emerging trend analysis with receipts. Niche spotlights, underground roundups, future-casting.',
    antiPatterns: 'Avoid covering what\'s already peaked. Don\'t do retrospective "best of" content — leave that to archivists. Skip mass-appeal compilations and safe recommendations.',
  },
  'L-3': {
    brief: 'The Patient Cultivator invests in long arcs. Where others chase quick wins, you see the slow compounding of quality over years. You nurture potential through sustained attention.',
    strengths: ['Long-term relationship building', 'Seeing potential before proof', 'Compounding creative returns', 'Depth over breadth'],
    weaknesses: ['Patience that becomes enabling of mediocrity', 'Sunk-cost attachment to failing projects', 'Missing windows of relevance', 'Under-valuing urgency'],
    contentStyle: 'Serialized content, ongoing documentaries, behind-the-scenes build logs. Multi-part series that reward loyal followers. Slow-reveal narratives, progress journals.',
    antiPatterns: 'Avoid one-off viral plays, disposable content, and anything designed for a single spike. Don\'t optimize for first-impression metrics. Skip rapid-fire posting cadences.',
  },
  'C-4': {
    brief: 'The Essential Editor knows what shouldn\'t exist. Your power is subtractive — you improve work by removing everything that doesn\'t serve it. Precision, not volume.',
    strengths: ['Ruthless editorial instinct', 'Clarity through subtraction', 'High signal-to-noise ratio', 'Making complex things feel simple'],
    weaknesses: ['Nihilistic rejection of good-enough work', 'Editing becomes procrastination', 'Cutting soul along with fat', 'Difficulty collaborating with additive thinkers'],
    contentStyle: 'Minimalist, high-density content. Tight captions, curated selections, distilled insights. "One thing" posts, edited-down compilations, precision hooks.',
    antiPatterns: 'Avoid verbose explainers, padded content, and filler for algorithm length. Don\'t create content that needs to be "watched until the end." Skip quantity-over-quality posting.',
  },
  'N-5': {
    brief: 'The Border Illuminator reveals connections between opposites. You thrive at intersections — finding how disparate fields, styles, and ideas secretly inform each other.',
    strengths: ['Cross-pollination between domains', 'Surprising juxtapositions', 'Translating between audiences', 'Making niche ideas accessible'],
    weaknesses: ['Refusing to commit to a lane', 'Scattering focus across too many intersections', 'Over-complicating simple concepts', 'Losing depth for breadth'],
    contentStyle: 'Cross-genre mashups, "X meets Y" features, interdisciplinary essays. Bridge content that introduces one audience to another\'s world. Remixes with unexpected sources.',
    antiPatterns: 'Avoid single-niche tunnel vision, pure genre content, and anything that only speaks to one tribe. Don\'t simplify to the point of losing the tension between ideas.',
  },
  'H-6': {
    brief: 'The Relentless Advocate converts skeptics. Your enthusiasm is a force — not hype, but genuine conviction that compels attention and changes minds.',
    strengths: ['Infectious enthusiasm', 'Converting indifferent audiences', 'Building movements around ideas', 'Passionate storytelling'],
    weaknesses: ['Missionary zeal that alienates', 'Difficulty accepting criticism of championed work', 'Burnout from constant advocacy', 'Blind spots for favored subjects'],
    contentStyle: 'Passionate recommendations, "you need to know about this" posts, persuasive reviews, community-building content. Call-to-action pieces, rallying cries, manifestos.',
    antiPatterns: 'Avoid neutral, uncommitted takes. Don\'t do lukewarm reviews or fence-sitting analysis. Skip content where you don\'t have genuine conviction — your audience reads insincerity.',
  },
  'P-7': {
    brief: 'The Living Archive holds deep lineage knowledge. You know where things come from, what influenced what, and why the canon matters. Your memory is the collection.',
    strengths: ['Encyclopedic contextual knowledge', 'Tracing influence chains', 'Preserving overlooked work', 'Providing historical depth to current trends'],
    weaknesses: ['Knowledge that never circulates', 'Gatekeeping through obscurity', 'Overvaluing precedent over innovation', 'Hoarding over sharing'],
    contentStyle: 'Reference posts, deep lineage threads, "the history of X" pieces. Annotated bibliographies, influence maps, archive dives. Educational long-form with rich sourcing.',
    antiPatterns: 'Avoid content without context or sourcing. Don\'t do hot takes without historical grounding. Skip ephemeral formats that can\'t carry your depth — stories and 15-second clips underserve you.',
  },
  'D-8': {
    brief: 'The Hollow Channel lets taste move through them. You don\'t impose — you receive, and your recommendations carry an uncanny accuracy because you\'re not filtering through ego.',
    strengths: ['Uncanny recommendation instinct', 'Ego-free curation', 'Channeling the zeitgeist naturally', 'Creating space for others\' expression'],
    weaknesses: ['Losing stable identity', 'Difficulty articulating your own taste', 'Being mistaken for lacking conviction', 'Absorbing others\' creative toxins'],
    contentStyle: 'Mood-driven curation, intuitive playlists, atmosphere-first content. Stream-of-consciousness posts, ambient collections, "vibe" compilations that feel uncannily right.',
    antiPatterns: 'Avoid heavily branded, personality-forward content. Don\'t force a consistent editorial voice — your power is that it shifts. Skip rigid content calendars and formulaic templates.',
  },
  'F-9': {
    brief: 'The Manifestor turns vision into tangible reality. Ideas are worthless to you until they\'re shipped. You have an action bias that converts abstract taste into concrete output.',
    strengths: ['Rapid execution', 'Shipping consistently', 'Turning ideas into products', 'Bias toward action over deliberation'],
    weaknesses: ['Only valuing shipped things', 'Sacrificing quality for output', 'Impatience with conceptual work', 'Burnout from relentless production'],
    contentStyle: 'High-volume, polished output. Finished projects, build-in-public logs, launch announcements. Portfolio-style content, case studies, before/after transformations.',
    antiPatterns: 'Avoid pure theory posts, endless ideation without output, and "coming soon" content. Don\'t tease without delivering. Skip planning-focused content — show the result.',
  },
  'R-10': {
    brief: 'The Productive Fracture breaks assumptions open. You reveal what\'s hidden by destroying the frame. Your contrarian instinct isn\'t negative — it\'s generative disruption.',
    strengths: ['Exposing hidden assumptions', 'Generative disruption', 'Forcing necessary conversations', 'Originality through negation'],
    weaknesses: ['Reflexive opposition as identity', 'Breaking things that didn\'t need breaking', 'Alienating potential allies', 'Contrarianism without construction'],
    contentStyle: 'Hot takes with substance, "actually, here\'s why that\'s wrong" pieces, counter-narratives. Debunking content, assumption-challenging threads, provocative reframes.',
    antiPatterns: 'Avoid agreeable, consensus content. Don\'t do "10 tips" posts or safe recommendations. Skip content where you\'re not challenging something — your audience comes for the friction.',
  },
  'NULL': {
    brief: 'The Receptive Presence absorbs without distortion. Pure reception — you take in everything and let it settle. Your value is in what you notice, not what you broadcast.',
    strengths: ['Deep listening', 'Noticing what others miss', 'Holding space for complexity', 'Receiving without judgment'],
    weaknesses: ['Intake with no output', 'Difficulty sharing what you absorb', 'Appearing passive when you\'re processing', 'Accumulation without expression'],
    contentStyle: 'Observational content, quiet photography, ambient documentation. Minimalist captions that let the work breathe. Collections with little commentary — trust the audience.',
    antiPatterns: 'Avoid loud, personality-driven content. Don\'t force opinions or hot takes. Skip high-energy presentation styles and performance-based formats. Your strength is stillness.',
  },
};

// ── Collapsible archetype accordion row ───────────────────────────────────────
function ArchetypeRow({ archetype, designation, isActive, isPrimary, isSecondary, distribution, primaryDesignation }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = ARCHETYPE_ICONS[designation] || CircleDot;
  const pct = Math.round((distribution || 0) * 100);
  const glowColor = isActive ? GLOW_BRIGHT : GLOW_DIM;

  return (
    <div
      className="border rounded-sm transition-all"
      style={{
        borderColor: isActive ? `${GLOW}66` : 'rgba(39,39,42,0.6)',
        boxShadow: isActive ? `0 0 8px 1px ${GLOW}18, inset 0 0 4px 0 ${GLOW}08` : 'none',
      }}
    >
      <button
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-800/40 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-sm border flex items-center justify-center flex-shrink-0"
          style={{ borderColor: isActive ? `${GLOW}44` : '#27272a', backgroundColor: isActive ? `${GLOW}08` : '#0a0a0c' }}
        >
          <IconComponent className="w-4 h-4" style={{ color: isActive ? GLOW_BRIGHT : '#52525b' }} />
        </div>
        <span className="text-[11px] text-dark-400 font-mono uppercase tracking-[0.28em] w-12 flex-shrink-0">
          {designation}
        </span>
        <span className="font-bold text-white uppercase tracking-tight flex-1 truncate" style={{ color: isActive ? GLOW_BRIGHT : '#d4d4d8' }}>
          {archetype.glyph || archetype.title}
        </span>
        <span className="text-xs text-dark-500 font-mono mr-2">{archetype.title}</span>
        <span className="text-sm font-mono font-semibold w-12 text-right" style={{ color: isActive ? GLOW_BRIGHT : '#71717a' }}>{pct}%</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: '#52525b' }}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-dark-700/40 animate-fade-in">
          {archetype.essence && (
            <p className="text-sm text-dark-200 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
              {archetype.essence}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {archetype.creativeMode && (
              <span className="px-2 py-0.5 border rounded-sm text-[11px] uppercase tracking-[0.12em] font-mono"
                style={{ borderColor: `${GLOW}33`, color: GLOW_DIM }}>
                {archetype.creativeMode}
              </span>
            )}
            {archetype.shadow && (
              <span
                className="px-2 py-0.5 border rounded-sm text-[11px] uppercase tracking-[0.08em] font-mono"
                style={{ borderColor: `${VIOLET}88`, color: VIOLET_TEXT }}
              >
                Shadow · {archetype.shadow}
              </span>
            )}
          </div>
          {isSecondary && primaryDesignation && (
            <p className="text-xs text-dark-400 leading-relaxed">
              Secondary influence at {pct}% — tempers your primary <span className="font-mono text-dark-200">{primaryDesignation}</span> with{' '}
              {archetype.title ? archetype.title.toLowerCase() : 'its'} sensibility.
            </p>
          )}
          {!isPrimary && !isSecondary && pct > 0 && (
            <p className="text-xs text-dark-500 leading-relaxed">
              Background resonance at {pct}% — a latent thread in your genome.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AchievementBadge({ achievement, unlocked }) {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.id] || Award;

  return (
    <div
      className={`relative p-3 rounded-sm border transition-all ${
        unlocked
          ? 'bg-dark-800/80 border-dark-600/60'
          : 'bg-dark-900 border-dark-700/40 opacity-40'
      }`}
      style={unlocked ? { boxShadow: `0 0 6px 1px ${GLOW}0d` } : {}}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-sm flex items-center justify-center"
          style={{ backgroundColor: unlocked ? `${GLOW}0d` : '#0a0a0c' }}
        >
          <IconComponent className="w-4 h-4" style={{ color: unlocked ? GLOW : '#27272a' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" style={{ color: unlocked ? GLOW_BRIGHT : '#52525b' }}>{achievement.name}</h4>
          <p className="text-xs text-dark-500 truncate">{achievement.description}</p>
        </div>
        {unlocked ? (
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: GLOW_DIM }} />
        ) : (
          <Lock className="w-4 h-4 text-dark-600 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function TasteGenome() {
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const activeFolioId = useAppStore((state) => state.activeFolioId);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const setActiveFolio = useAppStore((state) => state.setActiveFolio);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const [activeTab, setActiveTab] = useState('genome');
  const [genome, setGenome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allArchetypes, setAllArchetypes] = useState({});
  const [gamification, setGamification] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);
  const [preferences, setPreferences] = useState({
    authors: '',
    topics: '',
    books: '',
    influences: '',
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefMessage, setPrefMessage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSubdominant, setShowSubdominant] = useState(false);
  const [showAllArchetypes, setShowAllArchetypes] = useState(false);
  const [signals, setSignals] = useState([]);
  const [govMetrics, setGovMetrics] = useState({
    onBrand: 0,
    offBrand: 0,
    recent: 0,
    velocityScore: 0,
    trustScore: 0,
  });

  useEffect(() => {
    loadGenome();
    loadArchetypes();
  }, [currentProfileId]);

  const loadGenome = async () => {
    try {
      const result = await genomeApi.get(currentProfileId || null);
      if (result.hasGenome) {
        setGenome(result.genome);
        await loadSignals(result.genome);
      }
      const gamResult = await genomeApi.getGamification(currentProfileId || null);
      setGamification(gamResult);
      setAllAchievements(gamResult.allAchievements || []);
    } catch (error) {
      console.error('Failed to load genome:', error);
    } finally {
      setLoading(false);
    }
  };

  const computeGovernance = (signalsList, g) => {
    if (!g) return;
    const primary = g?.archetype?.primary?.designation;
    const now = Date.now();
    const horizon = 14 * 24 * 60 * 60 * 1000;
    const recentSignals = (signalsList || []).filter((s) => {
      if (!s.timestamp) return false;
      const ts = new Date(s.timestamp).getTime();
      return now - ts <= horizon;
    });

    const onBrand = recentSignals.filter((s) => s.data?.archetypeHint && s.data.archetypeHint === primary).length;
    const offBrand = recentSignals.filter((s) => s.data?.archetypeHint && s.data.archetypeHint !== primary).length;
    const total = recentSignals.length || 1;

    const signalsPerDay = total / 14;
    const cadence = Math.min(1, signalsPerDay / 5);
    const confidence = g?.archetype?.confidence || 0;
    const velocityScore = Math.round((confidence * 0.6 + cadence * 0.4) * 5 * 10) / 10;

    const onBrandRatio = onBrand / (onBrand + offBrand || 1);
    const trustScore = Math.round(((confidence * 0.5 + onBrandRatio * 0.5) * 100));

    setGovMetrics({
      onBrand,
      offBrand,
      recent: total === 1 ? 0 : total,
      velocityScore,
      trustScore,
    });
  };

  const loadSignals = async (gOverride = null) => {
    try {
      const res = await genomeApi.getSignals(currentProfileId || null, 100);
      const sigs = res.signals || [];
      setSignals(sigs);
      computeGovernance(sigs, gOverride || genome);
    } catch (error) {
      console.error('Failed to load signals:', error);
    }
  };

  const refreshGenomeQuietly = async () => {
    try {
      const result = await genomeApi.get(currentProfileId || null);
      if (result.hasGenome) {
        setGenome(result.genome);
        await loadSignals(result.genome);
      }
      const gamResult = await genomeApi.getGamification(currentProfileId || null);
      setGamification(gamResult);
      setAllAchievements(gamResult.allAchievements || []);
    } catch (error) {
      console.error('Failed to refresh genome:', error);
    }
  };

  const loadArchetypes = async () => {
    try {
      const result = await genomeApi.getArchetypes();
      setAllArchetypes(result.archetypes || {});
    } catch (error) {
      console.error('Failed to load archetypes:', error);
    }
  };

  const parseList = (text) =>
    text
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);

  const handleSavePreferences = async () => {
    const authors = parseList(preferences.authors);
    const topics = parseList(preferences.topics);
    const books = parseList(preferences.books);
    const influences = parseList(preferences.influences);

    if (!authors.length && !topics.length && !books.length && !influences.length) {
      setPrefMessage('Add at least one item before saving.');
      return;
    }

    setSavingPrefs(true);
    setPrefMessage(null);
    try {
      await genomeApi.signal(
        'preference',
        'subtaste-input',
        {
          authors,
          topics,
          books,
          influences,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      setPrefMessage('Locked into your taste genome. Keep adding signals anytime.');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setPrefMessage('Could not save preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Shared button style helper ──────────────────────────────────────────────
  const glowBtnStyle = {
    borderColor: `${GLOW}44`,
    color: GLOW,
    boxShadow: `0 0 8px 1px ${GLOW}11`,
  };
  const glowBtnHover = (e) => { e.currentTarget.style.boxShadow = `0 0 14px 3px ${GLOW}22`; };
  const glowBtnLeave = (e) => { e.currentTarget.style.boxShadow = `0 0 8px 1px ${GLOW}11`; };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: GLOW_DIM, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const primaryArch = genome?.archetype?.primary;
  // Use backend secondary if available, otherwise derive from distribution
  const GLYPH_MAP = { 'S-0': 'KETH', 'T-1': 'STRATA', 'V-2': 'OMEN', 'L-3': 'SILT', 'C-4': 'CULL', 'N-5': 'LIMN', 'H-6': 'TOLL', 'P-7': 'VAULT', 'D-8': 'WICK', 'F-9': 'ANVIL', 'R-10': 'SCHISM', 'NULL': 'VOID' };
  const secondaryArch = genome?.archetype?.secondary || (() => {
    const dist = genome?.archetype?.distribution;
    const primaryDesignation = primaryArch?.designation;
    if (!dist || !primaryDesignation) return null;
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    const second = sorted.find(([d]) => d !== primaryDesignation);
    if (!second) return null;
    return { designation: second[0], confidence: second[1], glyph: GLYPH_MAP[second[0]] || second[0] };
  })();
  const primaryDossier = primaryArch ? ARCHETYPE_DOSSIER[primaryArch.designation] : null;
  const secondaryDossier = secondaryArch ? ARCHETYPE_DOSSIER[secondaryArch.designation] : null;

  // ── Main Genome View ────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Dna className="w-7 h-7" style={{ color: GLOW, filter: `drop-shadow(0 0 4px ${GLOW}44)` }} />
            <span className="font-mono uppercase tracking-widest">Subtaste · Taste Genome</span>
          </h1>
          <p className="text-dark-500 mt-1 text-sm">Your creative DNA profile, wired into Folio and the content studio.</p>
          {primaryArch && (
            <div className="mt-2 flex items-center gap-3">
              <span
                className="px-3 py-1 bg-dark-900 border rounded-sm text-xs font-mono tracking-[0.3em] uppercase"
                style={{ borderColor: `${GLOW}44`, color: GLOW }}
              >
                {primaryArch.designation}
              </span>
              <span className="text-lg font-black uppercase tracking-[0.08em]" style={{ color: GLOW_BRIGHT }}>
                {primaryArch.glyph}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-dark-700/60">
        {[
          { id: 'genome', label: 'Genome' },
          { id: 'tuning', label: 'Tuning' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-mono uppercase tracking-widest transition-colors relative ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: GLOW_DIM }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Tuning Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'tuning' && (
        <div className="space-y-6">
          <div className="bg-dark-900/80 rounded-sm border p-4" style={{ borderColor: `${GLOW}11` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-[0.12em] font-mono">
                <FileText className="w-4 h-4" style={{ color: GLOW_DIM }} />
                Subtaste Inputs
              </h3>
              <span className="text-[11px] text-dark-600 font-mono uppercase tracking-[0.16em]">Profile-aware</span>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Supply high-signal influences. Stored against your profile and Folio IDs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-dark-500 mb-1">Active Folio</label>
                <input
                  type="text"
                  value={activeFolioId || ''}
                  onChange={(e) => setActiveFolio(e.target.value || null)}
                  className="input w-full"
                  placeholder="folio workspace id or slug"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1">Active Project</label>
                <input
                  type="text"
                  value={activeProjectId || ''}
                  onChange={(e) => setActiveProject(e.target.value || null)}
                  className="input w-full"
                  placeholder="project id (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-dark-500 mb-1">Authors / thinkers</label>
                <textarea
                  value={preferences.authors}
                  onChange={(e) => setPreferences({ ...preferences, authors: e.target.value })}
                  className="input w-full min-h-[70px] resize-none"
                  placeholder="Ursula Le Guin, Paul Graham, James Clear..."
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1">Topics & niches</label>
                <textarea
                  value={preferences.topics}
                  onChange={(e) => setPreferences({ ...preferences, topics: e.target.value })}
                  className="input w-full min-h-[70px] resize-none"
                  placeholder="AI agents, film color grading, creator economy..."
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1">Books / media</label>
                <textarea
                  value={preferences.books}
                  onChange={(e) => setPreferences({ ...preferences, books: e.target.value })}
                  className="input w-full min-h-[70px] resize-none"
                  placeholder="Story by McKee, The War of Art, Dark Forest..."
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1">Voices to emulate</label>
                <textarea
                  value={preferences.influences}
                  onChange={(e) => setPreferences({ ...preferences, influences: e.target.value })}
                  className="input w-full min-h-[70px] resize-none"
                  placeholder="MrBeast pacing, Ali Abdaal clarity, ContraPoints depth..."
                />
              </div>
            </div>
            {prefMessage && <p className="text-xs text-dark-400 mt-2">{prefMessage}</p>}
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="px-4 py-2 border rounded-sm font-mono uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                style={glowBtnStyle}
                onMouseEnter={glowBtnHover}
                onMouseLeave={glowBtnLeave}
              >
                {savingPrefs ? 'Saving...' : 'Save to Taste Genome'}
              </button>
            </div>
          </div>

          {/* Governance & Velocity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-dark-900/80 border rounded-sm" style={{ borderColor: `${GLOW}11` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-dark-500 uppercase tracking-[0.14em] font-mono">Resonance Velocity</span>
                <Activity className="w-4 h-4" style={{ color: GLOW_DIM }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{govMetrics.velocityScore.toFixed(1)}</p>
              <p className="text-xs text-dark-500">Confidence × recent signal cadence (last 14d)</p>
            </div>
            <div className="p-4 bg-dark-900/80 border rounded-sm" style={{ borderColor: `${GLOW}11` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-dark-500 uppercase tracking-[0.14em] font-mono">Trust / On-Brand</span>
                <Shield className="w-4 h-4" style={{ color: GLOW_DIM }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{govMetrics.trustScore}%</p>
              <p className="text-xs text-dark-500">
                On-brand ratio ({govMetrics.onBrand} vs {govMetrics.offBrand} off-brand hints)
              </p>
            </div>
            <div className="p-4 bg-dark-900/80 border rounded-sm" style={{ borderColor: `${GLOW}11` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-dark-500 uppercase tracking-[0.14em] font-mono">Recent Signals</span>
                <Scan className="w-4 h-4" style={{ color: GLOW_DIM }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{govMetrics.recent || 0}</p>
              <p className="text-xs text-dark-500">Last 14 days logged (choice/likert)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Genome Tab — No genome yet ─────────────────────────────────────── */}
      {activeTab === 'genome' && !genome && (
        <div className="text-center py-16 bg-dark-900/80 rounded-sm border" style={{ borderColor: `${GLOW}11` }}>
          <Dna className="w-16 h-16 mx-auto mb-4" style={{ color: '#27272a' }} />
          <h2 className="text-xl font-semibold text-white mb-2 font-mono uppercase tracking-widest">No Genome Yet</h2>
          <p className="text-dark-500 max-w-md mx-auto mb-6">
            Go to <a href="/profiles" className="underline" style={{ color: GLOW }}>Profiles</a> to take the archetype quiz and unlock your unique taste genome.
          </p>
        </div>
      )}

      {/* ── Genome Tab — Has genome ────────────────────────────────────────── */}
      {activeTab === 'genome' && genome && (
        <div className="space-y-6">

          {/* ── Primary Archetype Dossier — full width ── */}
          {primaryArch && (
            <div
              className="bg-dark-900/80 rounded-sm p-6 border"
              style={{ borderColor: `${GLOW}33`, boxShadow: `0 0 12px 2px ${GLOW}0d, inset 0 0 6px 0 ${GLOW}05` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-18 min-w-[72px] h-18 min-h-[72px] rounded-sm border bg-dark-900 flex items-center justify-center"
                  style={{ borderColor: `${GLOW}33` }}
                >
                  {(() => {
                    const IconComponent = ARCHETYPE_ICONS[primaryArch.designation] || CircleDot;
                    return <IconComponent className="w-8 h-8" style={{ color: GLOW, filter: `drop-shadow(0 0 6px ${GLOW}44)` }} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono tracking-[0.3em] uppercase mb-1" style={{ color: GLOW_DIM }}>
                    {primaryArch.designation}
                  </p>
                  <h2 className="text-4xl font-black uppercase font-mono tracking-[0.16em] leading-tight" style={{ color: GLOW_BRIGHT }}>
                    {primaryArch.glyph}
                  </h2>
                  <p className="text-sm font-semibold mt-1 uppercase tracking-[0.08em]" style={{ color: GLOW_DIM }}>
                    {primaryArch.title}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-bold font-mono" style={{ color: GLOW }}>
                    {Math.round((primaryArch.confidence || 0) * 100)}%
                  </p>
                  <p className="text-xs tracking-wide font-mono uppercase" style={{ color: '#52525b' }}>confidence</p>
                </div>
              </div>

              {/* Essence */}
              {primaryArch.essence && (
                <p
                  className="mb-4 leading-relaxed"
                  style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'italic', color: GLOW_DIM }}
                >
                  {primaryArch.essence}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="px-3 py-1 border rounded-sm text-xs uppercase tracking-[0.12em] font-mono"
                  style={{ borderColor: `${GLOW}33`, color: GLOW }}
                >
                  {primaryArch.creativeMode}
                </span>
                {primaryArch.shadow && (
                  <span
                    className="px-3 py-1 border rounded-sm text-xs uppercase tracking-[0.08em] font-mono"
                    style={{ borderColor: `${VIOLET}88`, color: VIOLET_TEXT }}
                  >
                    Shadow · {primaryArch.shadow}
                  </span>
                )}
              </div>

              {/* Twin narrative */}
              {secondaryArch && (
                <p className="text-sm leading-relaxed border-t pt-3" style={{ borderColor: `${GLOW}11`, color: GLOW_DIM }}>
                  Your primary archetype <span className="font-mono" style={{ color: GLOW_BRIGHT }}>{primaryArch.glyph}</span> is tempered by a secondary{' '}
                  <span className="font-mono" style={{ color: GLOW_BRIGHT }}>{secondaryArch.glyph}</span> influence at{' '}
                  {Math.round((secondaryArch.confidence || 0) * 100)}%. This blend grounds your {primaryArch.title?.toLowerCase() || 'primary'} drive with{' '}
                  {secondaryArch.title?.toLowerCase() || 'secondary'} sensibility — a dual-frequency signature unique to your genome.
                </p>
              )}
            </div>
          )}

          {/* ── Secondary Archetype Card — full width ── */}
          {secondaryArch && (
            <div
              className="bg-dark-900/80 rounded-sm p-4 border"
              style={{ borderColor: `${GLOW}1a`, boxShadow: `0 0 8px 1px ${GLOW}08` }}
            >
              <p className="text-xs mb-2 uppercase tracking-[0.14em] font-mono" style={{ color: '#52525b' }}>Secondary Influence</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-sm border bg-dark-900 flex items-center justify-center"
                  style={{ borderColor: `${GLOW}22` }}
                >
                  {(() => {
                    const IconComponent = ARCHETYPE_ICONS[secondaryArch.designation] || CircleDot;
                    return <IconComponent className="w-5 h-5" style={{ color: GLOW_DIM, filter: `drop-shadow(0 0 4px ${GLOW}33)` }} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>
                    {secondaryArch.designation}
                  </p>
                  <h3 className="font-semibold uppercase tracking-[0.08em]" style={{ color: GLOW }}>{secondaryArch.glyph}</h3>
                  <p className="text-xs" style={{ color: '#52525b' }}>
                    {Math.round((secondaryArch.confidence || 0) * 100)}% influence
                  </p>
                </div>
                {secondaryArch.essence && (
                  <p
                    className="hidden md:block text-xs max-w-xs leading-relaxed"
                    style={{ fontFamily: 'Inter, sans-serif', fontStyle: 'italic', color: '#52525b' }}
                  >
                    {secondaryArch.essence.length > 120 ? secondaryArch.essence.slice(0, 120) + '...' : secondaryArch.essence}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Full Genome Detail — full width ── */}
          <div className="space-y-6">
            <div>
              <div className="bg-dark-900/80 rounded-sm border p-4" style={{ borderColor: `${GLOW}11` }}>
                <button
                  onClick={() => setShowDetails((s) => !s)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-white uppercase tracking-[0.12em] font-mono">Full Genome Detail</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    style={{ color: '#52525b' }}
                  />
                </button>
                {showDetails && (
                  <div className="mt-4 space-y-5">

                    {/* ── Dominant ── */}
                    {primaryDossier && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <p className="text-xs uppercase tracking-[0.12em] font-mono" style={{ color: GLOW_BRIGHT }}>Dominant</p>
                          <span className="px-2 py-0.5 rounded-sm border text-xs font-mono" style={{ borderColor: `${GLOW}33`, color: GLOW }}>
                            {primaryArch.designation}
                          </span>
                          <span className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: GLOW_BRIGHT }}>
                            {primaryArch.glyph}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed" style={{ color: '#d4d4d8', fontFamily: 'Inter, sans-serif' }}>
                          {primaryDossier.brief}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: GLOW_DIM }}>Strengths</p>
                            <ul className="space-y-1">
                              {primaryDossier.strengths.map((s, i) => (
                                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#a1a1aa' }}>
                                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: GLOW_DIM }} />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: VIOLET_TEXT }}>Weaknesses</p>
                            <ul className="space-y-1">
                              {primaryDossier.weaknesses.map((w, i) => (
                                <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#71717a' }}>
                                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: `${VIOLET}cc` }} />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: GLOW_DIM }}>Content Style — Lean Into</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>{primaryDossier.contentStyle}</p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: VIOLET_TEXT }}>Anti-Patterns — Stay Away</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>{primaryDossier.antiPatterns}</p>
                        </div>
                      </div>
                    )}

                    {/* ── Subdominant — collapsible ── */}
                    {secondaryArch && secondaryDossier && (
                      <div className="pt-3" style={{ borderTop: `1px solid ${GLOW}11` }}>
                        <button
                          onClick={() => setShowSubdominant((s) => !s)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <p className="text-xs uppercase tracking-[0.12em] font-mono" style={{ color: VIOLET_TEXT }}>Subdominant</p>
                            <span className="px-2 py-0.5 rounded-sm border text-xs font-mono" style={{ borderColor: `${VIOLET}44`, color: VIOLET_TEXT }}>
                              {secondaryArch.designation}
                            </span>
                            <span className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: GLOW_DIM }}>
                              {secondaryArch.glyph}
                            </span>
                            <span className="text-xs font-mono" style={{ color: '#52525b' }}>
                              {Math.round((secondaryArch.confidence || 0) * 100)}%
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${showSubdominant ? 'rotate-180' : ''}`}
                            style={{ color: '#52525b' }}
                          />
                        </button>
                        {showSubdominant && (
                          <div className="mt-3 space-y-3">
                            <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa', fontFamily: 'Inter, sans-serif' }}>
                              {secondaryDossier.brief}
                            </p>

                            <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa', fontFamily: 'Inter, sans-serif' }}>
                              <span className="font-mono text-xs" style={{ color: VIOLET_TEXT }}>{secondaryArch.glyph}</span> influences your dominant <span className="font-mono text-xs" style={{ color: GLOW_BRIGHT }}>{primaryArch.glyph}</span> by
                              pulling toward {secondaryDossier.strengths[0]?.toLowerCase() || 'a complementary instinct'}{secondaryDossier.strengths[1] ? ` and ${secondaryDossier.strengths[1].toLowerCase()}` : ''}.
                              {primaryDossier?.weaknesses?.[0] && secondaryDossier.strengths?.[0] && (
                                <> It compensates for the dominant tendency toward {primaryDossier.weaknesses[0].toLowerCase()}, grounding it with {secondaryDossier.strengths[0].toLowerCase()}.</>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Distribution */}
                    {genome?.archetype?.distribution && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: GLOW_DIM }}>Distribution</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(genome.archetype.distribution).map(([designation, prob]) => {
                            const isP = designation === primaryArch?.designation;
                            return (
                              <div
                                key={designation}
                                className="rounded-sm border p-2 text-sm flex items-center justify-between font-mono"
                                style={{
                                  borderColor: isP ? `${GLOW}33` : '#1c1c1e',
                                  backgroundColor: '#0a0a0c',
                                  boxShadow: isP ? `0 0 6px 1px ${GLOW}0d` : 'none',
                                }}
                              >
                                <span className="tracking-[0.12em]" style={{ color: isP ? GLOW : '#52525b' }}>{designation}</span>
                                <span className="font-semibold" style={{ color: isP ? GLOW_BRIGHT : '#71717a' }}>{Math.round(prob * 100)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top Keywords */}
                    {genome?.keywords && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] mb-2 font-mono" style={{ color: GLOW_DIM }}>Top Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(genome.keywords?.content?.tone || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 6)
                            .map(([kw, score]) => (
                              <span
                                key={kw}
                                className="px-2 py-1 rounded-sm border text-xs font-mono"
                                style={{ borderColor: '#1c1c1e', color: GLOW_DIM }}
                                title={String(score)}
                              >
                                {kw}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Clearance Chamber — replaces gamified tier/XP/streak ── */}
            {gamification && (
              <div className="bg-dark-900/80 rounded-sm border p-4" style={{ borderColor: `${GLOW}11` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: `${VIOLET}0a`, border: `1px solid ${VIOLET}22` }}
                    >
                      <Lock className="w-5 h-5" style={{ color: VIOLET_TEXT }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>Clearance</p>
                      <h3 className="text-sm font-semibold font-mono uppercase tracking-[0.1em]" style={{ color: GLOW }}>{gamification.tier?.name || 'Nascent'}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>Depth</p>
                      <p className="text-sm font-mono" style={{ color: GLOW_DIM }}>{gamification.xp || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: '#52525b' }}>Signals</p>
                      <p className="text-sm font-mono" style={{ color: GLOW_DIM }}>{gamification.signalCount || genome?.signals?.length || 0}</p>
                    </div>
                  </div>
                </div>
                {/* Clearance progress — subtle bar */}
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#18181b' }}>
                  <div
                    className="h-full transition-all rounded-full"
                    style={{
                      width: `${Math.min(100, (gamification.xp || 0) / 20)}%`,
                      background: `linear-gradient(90deg, ${VIOLET}44, ${VIOLET}99)`,
                    }}
                  />
                </div>
                {/* Achievements — inline, subtle */}
                {allAchievements.some(a => gamification?.achievements?.some(u => u.id === a.id)) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allAchievements
                      .filter(a => gamification?.achievements?.some(u => u.id === a.id))
                      .map((achievement) => (
                        <span
                          key={achievement.id}
                          className="px-2 py-0.5 rounded-sm border text-[11px] font-mono uppercase tracking-[0.1em]"
                          style={{ borderColor: `${GLOW}22`, color: GLOW_DIM, backgroundColor: '#0a0a0c' }}
                          title={achievement.description}
                        >
                          {achievement.name}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── All Archetypes — Collapsible Section — full width ── */}
          <div className="bg-dark-900/80 rounded-sm border p-4" style={{ borderColor: `${GLOW}11` }}>
            <button
              onClick={() => setShowAllArchetypes((s) => !s)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-white uppercase tracking-[0.14em] font-mono">All Archetypes</h3>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showAllArchetypes ? 'rotate-180' : ''}`}
                style={{ color: '#52525b' }}
              />
            </button>
            {showAllArchetypes && (
              <div className="mt-3 space-y-1">
                {Object.entries(allArchetypes).map(([designation, archetype]) => (
                  <ArchetypeRow
                    key={designation}
                    archetype={archetype}
                    designation={designation}
                    isActive={primaryArch?.designation === designation}
                    isPrimary={primaryArch?.designation === designation}
                    isSecondary={secondaryArch?.designation === designation}
                    distribution={genome.archetype?.distribution?.[designation] || 0}
                    primaryDesignation={primaryArch?.designation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TasteGenome;
