import { useState, useEffect, useCallback } from 'react';
import { Crosshair, RefreshCw, ArrowRight, ChevronDown, ChevronUp, X, Eye, EyeOff } from 'lucide-react';
import {
  generateCharacter,
  applyVariance,
  createRng,
  HERITAGE_OPTIONS,
  NAME_MODES,
  CORE_STYLES,
  GENDER_OPTIONS,
} from '../../lib/characterGenerator';

// Bio-Glow Classified Palette
const GLOW = '#d4d4d8';
const GLOW_BRIGHT = '#e4e4e7';
const GLOW_DIM = '#a1a1aa';
const VIOLET = '#8b5cf6';
const VIOLET_TEXT = '#c4b5fd';

const COLOR_PALETTE = [
  '#d4d4d8', '#ec4899', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#f43f5e',
];

function PillSelector({ label, options, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-dark-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-zinc-300/10 text-zinc-200 border border-zinc-400/40'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-dark-700 text-dark-300',
    purple: 'bg-zinc-400/10 text-zinc-300 border border-zinc-500/30',
    blue: 'bg-zinc-400/[0.08] text-zinc-400 border border-zinc-600/30',
    amber: 'bg-violet-500/[0.08] text-violet-300/80 border border-violet-500/20',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

function AxisBar({ label, value, leftLabel, rightLabel }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-dark-500 w-16 text-right shrink-0">{leftLabel}</span>
      <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400/50 rounded-full transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-dark-500 w-16 shrink-0">{rightLabel}</span>
    </div>
  );
}

function mapVoiceTone(voiceTone) {
  const tone = voiceTone.toLowerCase();
  if (tone.includes('warm') || tone.includes('ember')) return 'conversational';
  if (tone.includes('command') || tone.includes('thunder')) return 'authoritative';
  if (tone.includes('musical') || tone.includes('harmonic')) return 'poetic';
  if (tone.includes('sharp') || tone.includes('gravel')) return 'raw';
  if (tone.includes('quiet') || tone.includes('crystal')) return 'vulnerable';
  if (tone.includes('rhythm') || tone.includes('echo')) return 'mentor';
  return 'conversational';
}

function buildSystemPrompt(generated) {
  const { name, heritage, order, arcana, personality, appearance } = generated;
  const traits = [];
  const { axes } = personality;
  traits.push(axes.orderChaos > 0.5 ? 'structured and deliberate' : 'spontaneous and adaptive');
  traits.push(axes.mercyRuthlessness > 0.5 ? 'compassionate' : 'unyielding');
  traits.push(axes.introvertExtrovert > 0.5 ? 'engaging and expressive' : 'measured and thoughtful');
  traits.push(axes.faithDoubt > 0.5 ? 'confident and assured' : 'questioning and curious');

  return `You are ${name}, a ${heritage} ${order.name} serving as a vessel of ${arcana.system} wisdom. ` +
    `Your archetype is ${arcana.archetype} (${arcana.meaning}). ` +
    `You are ${traits.join(', ')}. ` +
    `Your core desire: ${arcana.coreDesire}. Your deepest fear: ${personality.deepFear}. ` +
    `Your voice is ${personality.voiceTone}. ` +
    `Appearance: ${appearance.build}, with ${appearance.distinctiveTrait}. Style: ${appearance.styleAesthetic}. ` +
    `Speak with the weight of ages, yet remain approachable. Never break character.`;
}

export default function GeneratorPanel({ onAccept, onClose }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000_000));
  const [mode, setMode] = useState('character'); // 'character' | 'relic'
  const [heritage, setHeritage] = useState('');
  const [gender, setGender] = useState('');
  const [nameMode, setNameMode] = useState('standard');
  const [relicEra, setRelicEra] = useState('modern');
  const [coreStyle, setCoreStyle] = useState('');
  const [variance, setVariance] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const isRelic = mode === 'relic';

  const runGenerator = useCallback(() => {
    const isBlend = heritage === 'blend';
    const isMononym = nameMode !== 'standard';
    let mononymType = null;
    if (nameMode === 'mononym-squishe') mononymType = 'squishe';
    else if (nameMode === 'mononym-simple') mononymType = 'simple';
    else if (nameMode === 'aminal-blend') mononymType = 'aminal-blend';
    else if (nameMode === 'aminal-clear') mononymType = 'aminal-clear';

    const params = {
      seed,
      ...(heritage && !isBlend ? { heritage } : {}),
      ...(gender ? { gender } : {}),
      blendHeritage: isBlend,
      mononym: isMononym,
      ...(isMononym && mononymType ? { mononymType } : {}),
      relic: isRelic,
      ...(isRelic ? { relicEra } : {}),
      ...(coreStyle ? { core: coreStyle } : {}),
    };

    const result = generateCharacter(params);
    setGenerated(result);
  }, [seed, heritage, gender, nameMode, isRelic, relicEra, coreStyle]);

  useEffect(() => {
    runGenerator();
  }, [runGenerator]);

  const handleReroll = () => {
    setSeed(Math.floor(Math.random() * 10_000_000));
  };

  const handleAccept = async () => {
    if (!generated || accepting) return;
    setAccepting(true);
    try {
      const mapped = {
        name: displayName,
        bio: generated.backstory,
        voice: mapVoiceTone(generated.personality.voiceTone),
        color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
        personaTags: generated.subtaste
          ? [generated.subtaste.label, generated.subtaste.code]
          : [generated.arcana.archetype].filter(Boolean),
        toneAllowed: generated.arcana.goldenGifts || [],
        toneForbidden: generated.arcana.shadowThemes || [],
        systemPrompt: buildSystemPrompt(generated),
        lcosData: generated,
      };
      await onAccept(mapped);
    } finally {
      setAccepting(false);
    }
  };

  if (!generated) return null;

  // Apply variance to the name in real-time without re-running the full generator
  const displayName = variance > 0
    ? applyVariance(createRng(generated.seed + variance), generated.name, variance)
    : generated.name;

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-white font-mono uppercase tracking-wider">Generate Character</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAdminMode(!adminMode)}
            className={`p-1.5 rounded-lg transition-colors ${
              adminMode ? 'text-zinc-300 bg-zinc-400/10' : 'text-dark-500 hover:text-dark-300'
            }`}
            title={adminMode ? 'Hide system data' : 'Show system data (admin)'}
          >
            {adminMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Mode Tabs */}
        <div className="flex border-b border-dark-700">
          {[
            { value: 'character', label: 'Character' },
            { value: 'relic', label: 'Relic' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setMode(tab.value)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                mode === tab.value
                  ? 'border-zinc-300/60 text-white'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-3 p-4 bg-dark-900/50 rounded-lg border border-dark-700">
          <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">Settings</h3>

          {!isRelic && (
            <>
              <PillSelector
                label="Heritage"
                options={HERITAGE_OPTIONS}
                value={heritage || ''}
                onChange={(v) => setHeritage(v)}
              />

              <PillSelector
                label="Gender"
                options={[{ value: '', label: 'Any' }, ...GENDER_OPTIONS]}
                value={gender}
                onChange={(v) => setGender(v)}
              />

              <PillSelector
                label="Name Mode"
                options={NAME_MODES}
                value={nameMode}
                onChange={(v) => setNameMode(v)}
              />
            </>
          )}

          {isRelic && (
            <PillSelector
              label="Era"
              options={[
                { value: 'modern', label: 'Modern' },
                { value: 'archaic', label: 'Archaic' },
              ]}
              value={relicEra}
              onChange={(v) => setRelicEra(v)}
            />
          )}

          <PillSelector
            label="Aesthetic"
            options={CORE_STYLES}
            value={coreStyle}
            onChange={(v) => setCoreStyle(v)}
          />

          {/* Variance slider */}
          <div>
            <label className="block text-xs text-dark-400 mb-1.5 uppercase tracking-wider">
              Variance <span className="text-dark-500 ml-1 normal-case">{variance}%</span>
            </label>
            <style>{`
              .variance-slider { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
              .variance-slider::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, #374151 0%, ${GLOW} ${variance}%, #374151 ${variance}%); }
              .variance-slider::-moz-range-track { height: 6px; border-radius: 3px; background: #374151; }
              .variance-slider::-moz-range-progress { height: 6px; border-radius: 3px; background: ${GLOW}; }
              .variance-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${GLOW_DIM}; margin-top: -5px; border: 2px solid #1f2937; box-shadow: 0 0 4px rgba(212,212,216,0.4); }
              .variance-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${GLOW_DIM}; border: 2px solid #1f2937; box-shadow: 0 0 4px rgba(212,212,216,0.4); }
              .variance-slider::-webkit-slider-thumb:hover { background: ${GLOW}; box-shadow: 0 0 8px rgba(212,212,216,0.6); }
              .variance-slider::-moz-range-thumb:hover { background: ${GLOW}; box-shadow: 0 0 8px rgba(212,212,216,0.6); }
            `}</style>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={variance}
              onChange={(e) => setVariance(Number(e.target.value))}
              className="variance-slider w-full"
            />
            <div className="flex justify-between text-[10px] text-dark-600 mt-1">
              <span>Clean</span>
              <span>Corrupted</span>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="p-4 bg-dark-900/50 rounded-lg border border-dark-700 space-y-3">
          <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider">Result</h3>

          {/* Name */}
          <div className="text-2xl font-bold text-white font-display tracking-wide">
            {displayName}
          </div>

          {isRelic ? (
            /* Relic preview — narrative-driven, archetype woven into story */
            <>
              {generated.arcana?.coreDesire && (
                <p className="text-[10px] uppercase tracking-widest text-dark-500">
                  {generated.arcana.coreDesire}
                </p>
              )}

              {generated.relics?.[0]?.origin && (
                <div className="text-sm text-dark-300">
                  <span className="text-dark-500">Origin:</span>{' '}
                  {generated.relics[0].origin}
                </div>
              )}

              <div className="text-sm text-dark-400 leading-relaxed">
                {generated.backstory}
              </div>

              {(generated.pseudonym || generated.sacredNumber !== undefined) && (
                <div className="flex items-center gap-3 text-sm text-dark-500">
                  {generated.pseudonym && <span>aka {generated.pseudonym}</span>}
                  {generated.pseudonym && generated.sacredNumber !== undefined && (
                    <span className="text-dark-700">|</span>
                  )}
                  {generated.sacredNumber !== undefined && <span>No. {generated.sacredNumber}</span>}
                </div>
              )}

              {generated.samplePost && (
                <div className="text-sm text-dark-300 italic">
                  "{generated.samplePost}"
                </div>
              )}

              {/* Admin mode: show raw archetype data */}
              {adminMode && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dark-700">
                  <Badge variant="purple">{generated.heritage}</Badge>
                  <Badge variant="blue">{generated.order.name}</Badge>
                  <Badge variant="amber">{generated.arcana.system}: {generated.arcana.archetype}</Badge>
                </div>
              )}
            </>
          ) : (
            /* Character preview — badges + structured fields */
            <>
              <div className="flex flex-wrap gap-1.5">
                {adminMode ? (
                  <>
                    <Badge variant="purple">{generated.heritage}</Badge>
                    <Badge variant="blue">{generated.order.name}</Badge>
                    <Badge variant="amber">{generated.arcana.system}: {generated.arcana.archetype}</Badge>
                  </>
                ) : (
                  <>
                    {generated.subtaste && (
                      <>
                        <Badge variant="purple">{generated.subtaste.code}</Badge>
                        <Badge variant="amber">{generated.subtaste.glyph}</Badge>
                        <Badge variant="default">{generated.subtaste.label}</Badge>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="text-sm text-dark-300">
                <span className="text-dark-500">Appearance:</span>{' '}
                {generated.appearance.build}, {generated.appearance.distinctiveTrait}
              </div>
              <div className="text-sm text-dark-300">
                <span className="text-dark-500">Style:</span>{' '}
                {generated.appearance.styleAesthetic}
              </div>
              <div className="text-sm text-dark-300">
                <span className="text-dark-500">Voice:</span>{' '}
                {generated.personality.voiceTone}
              </div>

              <div className="text-sm text-dark-300">
                <span className="text-dark-500">Backstory:</span>{' '}
                {generated.backstory}
              </div>
            </>
          )}

          {/* Expandable details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-200 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDetails ? 'Hide' : 'Show'} archetype & personality details
          </button>

          {showDetails && (
            <div className="space-y-3 pt-2 border-t border-dark-700">
              {/* Archetype info — admin shows raw system, normal shows Subtaste */}
              {adminMode ? (
                <div className="text-sm">
                  <div className="text-dark-400 mb-1">
                    <span className="text-dark-500">System:</span>{' '}
                    {generated.arcana.system}
                  </div>
                  <div className="text-dark-400 mb-1">
                    <span className="text-dark-500">Archetype:</span>{' '}
                    {generated.arcana.archetype} — {generated.arcana.meaning}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Heritage:</span>{' '}
                    {generated.heritage}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Order:</span>{' '}
                    {generated.order.name} — {generated.order.ideology}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Core Desire:</span>{' '}
                    {generated.arcana.coreDesire}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Golden Gifts:</span>{' '}
                    {generated.arcana.goldenGifts?.join(', ')}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Shadow Themes:</span>{' '}
                    {generated.arcana.shadowThemes?.join(', ')}
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  {generated.subtaste && (
                    <div className="text-dark-400 mb-1">
                      <span className="text-dark-500">Designation:</span>{' '}
                      {generated.subtaste.code} {generated.subtaste.glyph} — {generated.subtaste.label}
                    </div>
                  )}
                  <div className="text-dark-400">
                    <span className="text-dark-500">Core Desire:</span>{' '}
                    {generated.arcana.coreDesire}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Strengths:</span>{' '}
                    {generated.arcana.goldenGifts?.join(', ')}
                  </div>
                  <div className="text-dark-400">
                    <span className="text-dark-500">Shadows:</span>{' '}
                    {generated.arcana.shadowThemes?.join(', ')}
                  </div>
                </div>
              )}

              {/* Personality axes */}
              <div className="space-y-2">
                <AxisBar value={generated.personality.axes.orderChaos} leftLabel="Order" rightLabel="Chaos" />
                <AxisBar value={generated.personality.axes.mercyRuthlessness} leftLabel="Mercy" rightLabel="Ruthless" />
                <AxisBar value={generated.personality.axes.introvertExtrovert} leftLabel="Introvert" rightLabel="Extrovert" />
                <AxisBar value={generated.personality.axes.faithDoubt} leftLabel="Faith" rightLabel="Doubt" />
              </div>

              <div className="text-sm text-dark-400">
                <span className="text-dark-500">Deep Fear:</span>{' '}
                {generated.personality.deepFear}
              </div>

              {adminMode && (
                <div className="text-sm text-dark-400">
                  <span className="text-dark-500">Order Ideology:</span>{' '}
                  {generated.order.ideology}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReroll}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 hover:text-white border border-transparent hover:border-zinc-500/30 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reroll
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="flex items-center gap-2 px-5 py-2 bg-dark-700 border border-zinc-500/40 text-zinc-200 rounded-lg hover:border-zinc-400/60 hover:text-zinc-100 transition-colors text-sm disabled:opacity-50"
            style={{ boxShadow: '0 0 10px 1px rgba(212,212,216,0.06)' }}
          >
            {accepting ? 'Creating...' : 'Accept & Create'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
