/**
 * HookGenerator Component
 * AI-powered content hook and caption generator
 */

import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, RefreshCw, Zap, Target } from 'lucide-react';
import { intelligenceApi } from '../../lib/api';

function VariantCard({ variant, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(variant.variant);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(variant.variant);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="p-3 bg-dark-750 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors group">
      {/* Hook text */}
      <p className="text-dark-100 text-sm leading-relaxed mb-2">
        {variant.variant}
      </p>

      {/* Metadata row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          {/* Performance score */}
          <span className={`flex items-center gap-1 ${getScoreColor(variant.performanceScore)}`}>
            <Zap className="w-3 h-3" />
            {variant.performanceScore}
          </span>
          {/* Taste score */}
          <span className={`flex items-center gap-1 ${getScoreColor(variant.tasteScore)}`}>
            <Target className="w-3 h-3" />
            {variant.tasteScore}
          </span>
          {/* Hook type badge */}
          <span className="px-1.5 py-0.5 bg-dark-600 rounded text-dark-300">
            {variant.hookType}
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Reasoning (collapsed by default) */}
      {variant.reasoning && (
        <p className="mt-2 text-[10px] text-dark-500 italic">
          {variant.reasoning}
        </p>
      )}
    </div>
  );
}

export function HookGenerator({ profileId, onSelect, className = '' }) {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await intelligenceApi.generate(topic, {
        platform,
        profileId,
        count: 5
      });

      setVariants(result.variants || []);
    } catch (err) {
      setError('Failed to generate hooks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input section */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="What's your content about?"
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 text-sm placeholder:text-dark-500 focus:outline-none focus:border-accent-purple"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 text-sm focus:outline-none focus:border-accent-purple"
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Hooks
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-dark-200">
              Generated Hooks
            </h4>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="p-1.5 text-dark-400 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            {variants.map((variant, index) => (
              <VariantCard
                key={index}
                variant={variant}
                onCopy={(text) => onSelect && onSelect(text, variant)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && variants.length === 0 && topic && (
        <div className="text-center py-8 text-dark-400">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter a topic and click generate</p>
        </div>
      )}
    </div>
  );
}

export function HookGeneratorModal({ isOpen, onClose, profileId, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-lg border border-dark-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-100">Hook Generator</h3>
              <p className="text-xs text-dark-400">AI-powered captions in your voice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <HookGenerator
            profileId={profileId}
            onSelect={(text, variant) => {
              if (onSelect) onSelect(text, variant);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default HookGenerator;
