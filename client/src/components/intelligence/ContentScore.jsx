/**
 * ContentScore Component
 * Displays AI-predicted performance score on content items
 */

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { intelligenceApi } from '../../lib/api';

function ScoreRing({ score, size = 'md', label }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 border-green-400';
    if (score >= 60) return 'text-yellow-400 border-yellow-400';
    if (score >= 40) return 'text-orange-400 border-orange-400';
    return 'text-red-400 border-red-400';
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-dark-700"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

export function ContentScoreBadge({ score, size = 'sm', showLabel = true }) {
  if (score === undefined || score === null) return null;

  const getScoreLabel = (score) => {
    if (score >= 80) return 'High Potential';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-1.5">
      <ScoreRing score={score} size={size} />
      {showLabel && (
        <span className="text-xs text-dark-400">{getScoreLabel(score)}</span>
      )}
    </div>
  );
}

export function ContentScoreCard({ content, profileId, onScored }) {
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);

  const handleScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await intelligenceApi.score({
        caption: content.caption,
        title: content.title,
        hashtags: content.hashtags,
        mediaType: content.mediaType
      }, profileId);

      setScoreData(result);
      if (onScored) onScored(result);
    } catch (err) {
      setError('Failed to score content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-score if content has caption
    if (content.caption || content.title) {
      handleScore();
    }
  }, [content.caption, content.title]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-dark-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Analyzing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1 text-red-400 text-xs">
        <AlertCircle className="w-3 h-3" />
        {error}
      </div>
    );
  }

  if (!scoreData) {
    return (
      <button
        onClick={handleScore}
        className="flex items-center gap-1 text-xs text-accent-purple hover:text-accent-pink transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        Score Content
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Scores */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <ScoreRing score={scoreData.overallScore} size="md" />
          <span className="text-[10px] text-dark-400 block mt-1">Overall</span>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Performance
            </span>
            <span className="font-medium">{scoreData.performanceScore}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Taste Match
            </span>
            <span className="font-medium">{scoreData.tasteScore}</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {scoreData.feedback && scoreData.feedback.length > 0 && (
        <div className="space-y-1">
          {scoreData.feedback.slice(0, 3).map((fb, i) => (
            <p key={i} className="text-[10px] text-dark-400 flex items-start gap-1">
              <Zap className="w-2.5 h-2.5 mt-0.5 text-yellow-400 flex-shrink-0" />
              {fb}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContentScoreOverlay({ score, className = '' }) {
  if (score === undefined || score === null) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500/80 to-green-600/80';
    if (score >= 60) return 'from-yellow-500/80 to-yellow-600/80';
    if (score >= 40) return 'from-orange-500/80 to-orange-600/80';
    return 'from-red-500/80 to-red-600/80';
  };

  return (
    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r ${getScoreColor(score)} text-white text-xs font-bold shadow-lg ${className}`}>
      <span className="flex items-center gap-1">
        <Zap className="w-3 h-3" />
        {score}
      </span>
    </div>
  );
}

export default ContentScoreCard;
