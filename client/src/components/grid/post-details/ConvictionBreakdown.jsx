import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle, XCircle, TrendingUp, Palette, Shield, Lightbulb } from 'lucide-react';
import { convictionApi } from '../../../lib/api';
import ConvictionBadge from '../../conviction/ConvictionBadge';

const COMPONENT_META = {
  taste: { label: 'Taste Alignment', icon: Palette, weight: '50%', color: 'purple', desc: 'How well this matches your established creative identity' },
  performance: { label: 'Performance Potential', icon: TrendingUp, weight: '30%', color: 'blue', desc: 'Predicted engagement based on content analysis' },
  brand: { label: 'Brand Consistency', icon: Shield, weight: '20%', color: 'emerald', desc: 'Alignment with your brand voice and feed aesthetic' },
};

const BAR_COLORS = {
  purple: { bar: 'bg-purple-500', track: 'bg-purple-500/10' },
  blue: { bar: 'bg-blue-500', track: 'bg-blue-500/10' },
  emerald: { bar: 'bg-emerald-500', track: 'bg-emerald-500/10' },
};

const TIER_LABELS = {
  exceptional: { label: 'Exceptional', class: 'text-green-400' },
  high: { label: 'High', class: 'text-green-400' },
  medium: { label: 'Needs Work', class: 'text-orange-400' },
  low: { label: 'Low', class: 'text-red-400' },
};

const GATING_ICONS = {
  approved: CheckCircle,
  warning: AlertTriangle,
  blocked: XCircle,
  override: CheckCircle,
};

const GATING_COLORS = {
  approved: 'text-green-400',
  warning: 'text-orange-400',
  blocked: 'text-red-400',
  override: 'text-blue-400',
};

function ScoreBar({ value, color }) {
  const colors = BAR_COLORS[color] || BAR_COLORS.purple;
  return (
    <div className={`h-1.5 rounded-full ${colors.track} overflow-hidden`}>
      <div
        className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const ConvictionBreakdown = React.memo(function ConvictionBreakdown({ postId, profileId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setReport(null);
    setError(null);
  }, [postId]);

  const fetchReport = async () => {
    if (report || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await convictionApi.getReport(postId, profileId);
      setReport(res.report);
    } catch (err) {
      console.error('[ConvictionBreakdown] Failed to fetch report:', err);
      setError('Could not load conviction breakdown');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!expanded && !report && !loading) {
      fetchReport();
    }
    setExpanded(!expanded);
  };

  const conviction = report?.conviction;
  const gating = report?.gating;
  const recommendations = report?.recommendations;

  const score = conviction?.score;
  const tier = conviction?.tier;
  const breakdown = conviction?.breakdown;
  const archetype = conviction?.archetypeMatch;

  const GatingIcon = gating ? GATING_ICONS[gating.status] || AlertTriangle : AlertTriangle;
  const gatingColor = gating ? GATING_COLORS[gating.status] || 'text-dark-400' : 'text-dark-400';
  const tierInfo = tier ? TIER_LABELS[tier] || TIER_LABELS.medium : null;

  return (
    <div className="border-t border-dark-700">
      {/* Collapsed header — always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-700/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-dark-300 uppercase tracking-wide">Conviction</span>
          {score != null && (
            <ConvictionBadge score={score} tier={tier} size="xs" showGlyph archetypeMatch={archetype} />
          )}
          {tierInfo && (
            <span className={`text-[11px] ${tierInfo.class}`}>{tierInfo.label}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 text-dark-400 animate-spin" />}
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-dark-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-dark-500" />
          }
        </div>
      </button>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {loading && !report && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
              <span className="text-xs text-dark-400 ml-2">Analyzing...</span>
            </div>
          )}

          {breakdown && (
            <>
              {/* Component scores */}
              <div className="space-y-3">
                {['taste', 'performance', 'brand'].map((key) => {
                  const meta = COMPONENT_META[key];
                  const Icon = meta.icon;
                  const val = breakdown[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3 text-dark-400" />
                          <span className="text-[11px] text-dark-300">{meta.label}</span>
                          <span className="text-[10px] text-dark-500">({meta.weight})</span>
                        </div>
                        <span className="text-[11px] text-dark-200 font-medium tabular-nums">{val}</span>
                      </div>
                      <ScoreBar value={val} color={meta.color} />
                      <p className="text-[10px] text-dark-500 mt-0.5">{meta.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Archetype */}
              {archetype?.designation && (
                <div className="flex items-center gap-2 px-3 py-2 bg-dark-900/50 rounded-lg">
                  {archetype.glyph && (
                    <span className="text-base">{archetype.glyph}</span>
                  )}
                  <div>
                    <p className="text-[11px] text-dark-200 font-medium">{archetype.designation}</p>
                    {archetype.confidence > 0 && (
                      <p className="text-[10px] text-dark-500">{Math.round(archetype.confidence * 100)}% match</p>
                    )}
                  </div>
                </div>
              )}

              {/* Gating status */}
              {gating && (
                <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
                  gating.status === 'approved' ? 'bg-green-500/5' :
                  gating.status === 'warning' ? 'bg-orange-500/5' :
                  gating.status === 'blocked' ? 'bg-red-500/5' :
                  'bg-blue-500/5'
                }`}>
                  <GatingIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${gatingColor}`} />
                  <p className="text-[11px] text-dark-300">{gating.reason}</p>
                </div>
              )}

              {/* Recommendations */}
              {recommendations && recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-dark-400" />
                    <span className="text-[11px] text-dark-400 uppercase tracking-wide">Suggestions</span>
                  </div>
                  {recommendations.map((rec, i) => (
                    <div key={i} className="pl-4">
                      <p className="text-[11px] text-dark-300 font-medium">{rec.message}</p>
                      {rec.actions && rec.actions.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {rec.actions.map((action, j) => (
                            <li key={j} className="text-[10px] text-dark-500 flex items-start gap-1.5">
                              <span className="text-dark-600 mt-0.5">-</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default ConvictionBreakdown;
