/**
 * TasteProfile Component
 * Displays the user's learned content DNA patterns
 */

import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, MessageSquare, Palette, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { intelligenceApi } from '../../lib/api';

function PatternTag({ children, type = 'default' }) {
  const typeClasses = {
    default: 'bg-dark-600 text-dark-200',
    positive: 'bg-green-500/20 text-green-400',
    negative: 'bg-red-500/20 text-red-400',
    highlight: 'bg-accent-purple/20 text-accent-purple'
  };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs ${typeClasses[type]}`}>
      {children}
    </span>
  );
}

function PatternSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent-purple" />
        {title}
      </h4>
      {children}
    </div>
  );
}

export function TasteProfileCard({ profileId, compact = false }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await intelligenceApi.getProfile(profileId);
      setProfile(result.hasProfile ? result.tasteProfile : null);
    } catch (err) {
      setError('Failed to load taste profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-dark-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <Brain className="w-12 h-12 mx-auto mb-3 text-dark-500" />
        <h3 className="text-dark-200 font-medium mb-1">No Taste Profile Yet</h3>
        <p className="text-dark-400 text-sm max-w-xs mx-auto">
          Create and publish content to build your unique creative DNA
        </p>
      </div>
    );
  }

  const { performancePatterns = {}, aestheticPatterns = {}, voiceSignature = {}, confidence = 0, itemCount = 0 } = profile;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Confidence indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400">Profile Confidence</span>
          <span className="text-dark-200">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>

        {/* Top patterns */}
        <div className="flex flex-wrap gap-1.5">
          {aestheticPatterns.dominantTones?.slice(0, 3).map((tone, i) => (
            <PatternTag key={i} type="highlight">{tone}</PatternTag>
          ))}
          {performancePatterns.hooks?.slice(0, 2).map((hook, i) => (
            <PatternTag key={`h-${i}`}>{hook}</PatternTag>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 rounded-xl">
            <Brain className="w-6 h-6 text-accent-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-dark-100">Your Taste DNA</h3>
            <p className="text-xs text-dark-400">
              Based on {itemCount} content items • {Math.round(confidence * 100)}% confident
            </p>
          </div>
        </div>
        <button
          onClick={loadProfile}
          className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400">Profile Confidence</span>
          <span className="text-dark-200">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-purple to-accent-pink transition-all"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Performance Patterns */}
      <PatternSection title="Performance Patterns" icon={TrendingUp}>
        <div className="space-y-3">
          {/* Hooks */}
          {performancePatterns.hooks?.length > 0 && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Winning Hooks</p>
              <div className="flex flex-wrap gap-1.5">
                {performancePatterns.hooks.map((hook, i) => (
                  <PatternTag key={i} type="positive">{hook}</PatternTag>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {performancePatterns.sentiment?.length > 0 && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Winning Sentiments</p>
              <div className="flex flex-wrap gap-1.5">
                {performancePatterns.sentiment.map((s, i) => (
                  <PatternTag key={i}>{s}</PatternTag>
                ))}
              </div>
            </div>
          )}

          {/* Structure */}
          {performancePatterns.structure?.length > 0 && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Winning Structures</p>
              <div className="flex flex-wrap gap-1.5">
                {performancePatterns.structure.map((s, i) => (
                  <PatternTag key={i}>{s}</PatternTag>
                ))}
              </div>
            </div>
          )}
        </div>
      </PatternSection>

      {/* Aesthetic Patterns */}
      <PatternSection title="Aesthetic Patterns" icon={Palette}>
        <div className="space-y-3">
          {/* Dominant Tones */}
          {aestheticPatterns.dominantTones?.length > 0 && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Your Signature Tones</p>
              <div className="flex flex-wrap gap-1.5">
                {aestheticPatterns.dominantTones.map((tone, i) => (
                  <PatternTag key={i} type="highlight">{tone}</PatternTag>
                ))}
              </div>
            </div>
          )}

          {/* Avoid Tones */}
          {aestheticPatterns.avoidTones?.length > 0 && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Tones to Avoid</p>
              <div className="flex flex-wrap gap-1.5">
                {aestheticPatterns.avoidTones.map((tone, i) => (
                  <PatternTag key={i} type="negative">{tone}</PatternTag>
                ))}
              </div>
            </div>
          )}

          {/* Voice */}
          {aestheticPatterns.voice && (
            <div>
              <p className="text-xs text-dark-400 mb-1.5">Voice Style</p>
              <PatternTag type="highlight">{aestheticPatterns.voice}</PatternTag>
            </div>
          )}
        </div>
      </PatternSection>

      {/* Voice Signature */}
      {(voiceSignature.sentencePatterns?.length > 0 || voiceSignature.rhetoricalDevices?.length > 0) && (
        <PatternSection title="Voice Signature" icon={MessageSquare}>
          <div className="space-y-3">
            {voiceSignature.sentencePatterns?.length > 0 && (
              <div>
                <p className="text-xs text-dark-400 mb-1.5">Sentence Patterns</p>
                <div className="flex flex-wrap gap-1.5">
                  {voiceSignature.sentencePatterns.map((p, i) => (
                    <PatternTag key={i}>{p}</PatternTag>
                  ))}
                </div>
              </div>
            )}

            {voiceSignature.rhetoricalDevices?.length > 0 && (
              <div>
                <p className="text-xs text-dark-400 mb-1.5">Rhetorical Devices</p>
                <div className="flex flex-wrap gap-1.5">
                  {voiceSignature.rhetoricalDevices.map((d, i) => (
                    <PatternTag key={i}>{d}</PatternTag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PatternSection>
      )}
    </div>
  );
}

export function TasteProfileMini({ profileId }) {
  return <TasteProfileCard profileId={profileId} compact />;
}

export default TasteProfileCard;
