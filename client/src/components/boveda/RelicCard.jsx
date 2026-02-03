// Pack relic card — curated data (icon, name, description, lore)
export default function RelicCard({ relic }) {
  return (
    <div
      className="bg-dark-800 rounded-xl border border-zinc-500/20 p-5 text-center transition-all"
      style={{ boxShadow: '0 0 12px 2px rgba(161,161,170,0.06)' }}
    >
      <div className="text-4xl mb-3">{relic.icon}</div>
      <h3 className="font-semibold text-white text-sm mb-1">{relic.name}</h3>
      <p className="text-xs text-dark-300 mb-1">{relic.description}</p>
      <p className="text-xs text-dark-400 italic mb-2">{relic.lore}</p>
      <span className="inline-block text-[10px] uppercase tracking-widest text-dark-600">
        Tier {relic.tier}
      </span>
    </div>
  );
}

// Generated relic card — narrative-driven, archetype woven into backstory
// lcosData.relics is an array like [{ object, origin, era, ... }]
// Archetype data (arcana, order, personality) informs the story, not shown as raw tags
export function GeneratedRelicCard({ character }) {
  const lcos = character.lcosData || {};
  const relic = lcos.relics?.[0] || {};
  const objectName = relic.object || character.name || 'Unknown Relic';
  const origin = relic.origin || null;
  const pseudonym = lcos.pseudonym || null;
  const sacredNumber = lcos.sacredNumber ?? null;
  const backstory = lcos.backstory || character.bio || null;
  const essence = lcos.arcana?.coreDesire || null;
  const samplePost = lcos.samplePost || null;

  return (
    <div
      className="bg-dark-800 rounded-xl border border-zinc-500/20 p-5 transition-all"
      style={{ boxShadow: '0 0 12px 2px rgba(161,161,170,0.06)' }}
    >
      <h3 className="font-semibold text-white text-sm mb-1">{objectName}</h3>

      {essence && (
        <p className="text-[10px] uppercase tracking-widest text-dark-500 mb-3">{essence}</p>
      )}

      {origin && (
        <p className="text-xs text-dark-300 mb-2">
          <span className="text-dark-500">Origin:</span> {origin}
        </p>
      )}

      {backstory && (
        <p className="text-xs text-dark-400 leading-relaxed mb-2">{backstory}</p>
      )}

      {(pseudonym || sacredNumber !== null) && (
        <div className="flex items-center gap-3 text-xs text-dark-500 mt-2">
          {pseudonym && <span>aka {pseudonym}</span>}
          {pseudonym && sacredNumber !== null && <span className="text-dark-700">|</span>}
          {sacredNumber !== null && <span>No. {sacredNumber}</span>}
        </div>
      )}

      {samplePost && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          <span className="text-[10px] uppercase tracking-widest text-dark-500">Sample Post</span>
          <p className="text-xs text-dark-400 italic mt-1 line-clamp-3">"{samplePost}"</p>
        </div>
      )}
    </div>
  );
}
