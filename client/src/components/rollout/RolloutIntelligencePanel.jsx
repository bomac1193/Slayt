import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { rolloutApi } from '../../lib/api';

/**
 * Readiness Check Panel
 *
 * Displays conviction-based readiness:
 * - Section readiness (conviction gating)
 * - Overall stats (sections ready, total pieces, avg conviction)
 * - Blocked sections list
 */
export default function RolloutIntelligencePanel({ rolloutId, rollout }) {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!rolloutId) return;
    loadIntelligence();
  }, [rolloutId]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      const data = await rolloutApi.getIntelligence(rolloutId);
      setIntelligence(data.intelligence);
      setError(null);
    } catch (err) {
      console.error('Failed to load intelligence:', err);
      setError('Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-dark-400">Analyzing readiness...</span>
        </div>
      </div>
    );
  }

  if (error || !intelligence) {
    return null;
  }

  const { overallReadiness, sections } = intelligence;
  const allReady = overallReadiness.ready;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-dark-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent-purple" />
          <div className="text-left">
            <h3 className="font-semibold text-white">Readiness Check</h3>
            <p className="text-sm text-dark-400">Conviction-based launch readiness</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {allReady ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              Ready to Launch
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              {overallReadiness.readySections}/{overallReadiness.totalSections} Sections Ready
            </span>
          )}

          {expanded ? (
            <ChevronUp className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 py-4 space-y-6 border-t border-dark-700">
          {/* Overall Readiness */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-purple" />
              Overall Readiness
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Sections Ready"
                value={`${overallReadiness.readySections}/${overallReadiness.totalSections}`}
                color={allReady ? 'green' : 'orange'}
              />
              <StatCard
                label="Total Pieces"
                value={overallReadiness.totalPieces}
                color="neutral"
              />
              <StatCard
                label="Avg Conviction"
                value={overallReadiness.avgConviction}
                color={overallReadiness.avgConviction >= 70 ? 'green' : 'orange'}
              />
            </div>
          </div>

          {/* Section Readiness Details */}
          {sections && sections.some(s => !s.ready) && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Sections Blocked
              </h4>
              <div className="space-y-2">
                {sections.filter(s => !s.ready).map((section, idx) => (
                  <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-orange-400">{section.sectionName}</span>
                      <span className="text-xs text-orange-400">
                        {section.stats.belowThreshold} blocked
                      </span>
                    </div>
                    <p className="text-sm text-white mb-2">{section.message}</p>
                    {section.suggestions.length > 0 && (
                      <ul className="space-y-1">
                        {section.suggestions.slice(0, 2).map((suggestion, sIdx) => (
                          <li key={sIdx} className="text-xs text-orange-300">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
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

function StatCard({ label, value, color = 'neutral' }) {
  const colors = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    neutral: 'bg-dark-750 border-dark-600 text-dark-200',
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="text-xs opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
