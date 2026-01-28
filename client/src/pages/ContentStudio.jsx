import { useState, useEffect } from 'react';
import { intelligenceApi, genomeApi } from '../lib/api';
import folioApi, { folioAuth, isFolioConnected, getFolioUser } from '../lib/folioApi';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Copy,
  Check,
  BarChart3,
  Target,
  Lightbulb,
  RefreshCw,
  Link2,
  LogOut,
  ExternalLink,
  Dna,
} from 'lucide-react';

function ScoreRing({ score, size = 60, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

function VariantCard({ variant, index, onCopy, copied }) {
  return (
    <div className="bg-dark-700 rounded-xl p-4 hover:bg-dark-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-white flex-1 leading-relaxed">{variant.variant}</p>
        <button
          onClick={() => onCopy(variant.variant, index)}
          className="p-2 text-dark-400 hover:text-white rounded-lg flex-shrink-0 transition-colors"
        >
          {copied === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="px-2 py-1 bg-accent-purple/20 text-accent-purple rounded text-xs font-medium">
          {variant.hookType}
        </span>
        <span className="px-2 py-1 bg-dark-600 text-dark-300 rounded text-xs">
          {variant.tone}
        </span>
        <div className="flex items-center gap-4 ml-auto text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {variant.performanceScore}%
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {variant.tasteScore}%
          </span>
        </div>
      </div>
      {variant.reasoning && (
        <p className="mt-2 text-xs text-dark-400 italic">{variant.reasoning}</p>
      )}
    </div>
  );
}

function ContentStudio() {
  const [activeTab, setActiveTab] = useState('generate');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [copied, setCopied] = useState(null);

  // Score tab state
  const [scoreCaption, setScoreCaption] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  // Trending
  const [trending, setTrending] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [trendingNiche, setTrendingNiche] = useState('creator');

  // Taste Profile
  const [tasteProfile, setTasteProfile] = useState(null);

  // Folio integration
  const [folioConnected, setFolioConnected] = useState(false);
  const [folioUser, setFolioUser] = useState(null);
  const [folioEmail, setFolioEmail] = useState('');
  const [folioPassword, setFolioPassword] = useState('');
  const [folioLoggingIn, setFolioLoggingIn] = useState(false);
  const [folioError, setFolioError] = useState('');
  const [folioTasteProfile, setFolioTasteProfile] = useState(null);
  const [useFolioForGeneration, setUseFolioForGeneration] = useState(false);

  useEffect(() => {
    loadTasteProfile();
    checkFolioConnection();
  }, []);

  const loadTasteProfile = async () => {
    try {
      const result = await intelligenceApi.getProfile();
      if (result.hasProfile) {
        setTasteProfile(result.tasteProfile);
      }
    } catch (error) {
      console.error('Failed to load taste profile:', error);
    }
  };

  const checkFolioConnection = async () => {
    if (isFolioConnected()) {
      setFolioConnected(true);
      setFolioUser(getFolioUser());
      // Try to load Folio taste profile
      try {
        const session = await folioAuth.getSession();
        if (session) {
          const profile = await folioApi.tasteProfile.get();
          setFolioTasteProfile(profile);
        }
      } catch (error) {
        console.error('Failed to load Folio profile:', error);
      }
    }
  };

  const handleFolioLogin = async (e) => {
    e.preventDefault();
    setFolioLoggingIn(true);
    setFolioError('');
    try {
      const result = await folioAuth.login(folioEmail, folioPassword);
      setFolioConnected(true);
      setFolioUser(result.user);
      setFolioEmail('');
      setFolioPassword('');
      // Load Folio taste profile
      try {
        const profile = await folioApi.tasteProfile.get();
        setFolioTasteProfile(profile);
      } catch (err) {
        console.error('Failed to load Folio profile:', err);
      }
    } catch (error) {
      setFolioError(error.message || 'Failed to connect to Folio');
    } finally {
      setFolioLoggingIn(false);
    }
  };

  const handleFolioLogout = () => {
    folioAuth.logout();
    setFolioConnected(false);
    setFolioUser(null);
    setFolioTasteProfile(null);
    setUseFolioForGeneration(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      let result;
      if (useFolioForGeneration && folioConnected) {
        // Use Folio's AI generation
        const platformMap = {
          instagram: 'INSTAGRAM_REEL',
          tiktok: 'TIKTOK',
          youtube: 'YOUTUBE_SHORT',
          linkedin: 'LINKEDIN',
        };
        result = await folioApi.generate.variants(
          topic,
          platformMap[platform] || 'INSTAGRAM_REEL',
          5,
          [],
          'generate',
          'English'
        );
      } else {
        // Use local Slayt AI generation
        result = await intelligenceApi.generate(topic, { platform, count: 5 });
      }
      setVariants(result.variants || []);
    } catch (error) {
      console.error('Generate error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleScore = async () => {
    if (!scoreCaption.trim()) return;
    setScoring(true);
    try {
      const result = await intelligenceApi.score({ caption: scoreCaption });
      setScoreResult(result);
    } catch (error) {
      console.error('Score error:', error);
    } finally {
      setScoring(false);
    }
  };

  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const result = await intelligenceApi.getTrending(trendingNiche, platform);
      setTrending(result);
    } catch (error) {
      console.error('Trending error:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-accent-purple" />
          Content Studio
        </h1>
        <p className="text-dark-400 mt-1">AI-powered content generation and scoring based on your taste profile</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 rounded-lg p-1 w-fit">
        {[
          { id: 'generate', label: 'Generate', icon: Sparkles },
          { id: 'score', label: 'Score', icon: BarChart3 },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'folio', label: 'Folio', icon: Link2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-accent-purple text-white'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Folio Mode Indicator */}
          {useFolioForGeneration && folioConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-purple/10 border border-accent-purple/30 rounded-lg">
              <Link2 className="w-4 h-4 text-accent-purple" />
              <span className="text-sm text-accent-purple">Using Folio's AI for generation</span>
              <button
                onClick={() => setUseFolioForGeneration(false)}
                className="ml-auto text-xs text-dark-400 hover:text-white"
              >
                Switch to local
              </button>
            </div>
          )}

          {/* Input */}
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <label className="block text-sm text-dark-300 mb-2">What do you want to create content about?</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic, idea, or prompt..."
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
              </select>
              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {generating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                Generate
              </button>
            </div>
          </div>

          {/* Results */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Generated Hooks & Captions</h3>
              {variants.map((v, i) => (
                <VariantCard
                  key={i}
                  variant={v}
                  index={i}
                  onCopy={copyToClipboard}
                  copied={copied}
                />
              ))}
            </div>
          )}

          {/* Taste Profile Summary */}
          {tasteProfile && (
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-purple" />
                Your Taste Profile
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-dark-400 text-xs mb-1">Preferred Hooks</p>
                  <div className="flex flex-wrap gap-1">
                    {(tasteProfile.performancePatterns?.hooks || []).slice(0, 3).map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-dark-700 rounded text-dark-200">{h}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-dark-400 text-xs mb-1">Voice</p>
                  <span className="text-white capitalize">{tasteProfile.aestheticPatterns?.voice || 'conversational'}</span>
                </div>
                <div>
                  <p className="text-dark-400 text-xs mb-1">Dominant Tones</p>
                  <div className="flex flex-wrap gap-1">
                    {(tasteProfile.aestheticPatterns?.dominantTones || []).slice(0, 3).map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-dark-700 rounded text-dark-200">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-dark-400 text-xs mb-1">Confidence</p>
                  <span className="text-white">{Math.round((tasteProfile.confidence || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Tab */}
      {activeTab === 'score' && (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <label className="block text-sm text-dark-300 mb-2">Paste your caption to score</label>
            <textarea
              value={scoreCaption}
              onChange={(e) => setScoreCaption(e.target.value)}
              placeholder="Enter your caption or hook to see how well it matches your taste profile..."
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white h-32 resize-none"
            />
            <button
              onClick={handleScore}
              disabled={scoring || !scoreCaption.trim()}
              className="mt-3 px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {scoring ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Analyze Score
            </button>
          </div>

          {scoreResult && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <ScoreRing score={scoreResult.overallScore} size={100} strokeWidth={6} />
                  <p className="text-sm text-dark-400 mt-2">Overall</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={scoreResult.performanceScore} size={80} />
                  <p className="text-sm text-dark-400 mt-2">Performance</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={scoreResult.tasteScore} size={80} />
                  <p className="text-sm text-dark-400 mt-2">Taste Match</p>
                </div>
              </div>

              {scoreResult.feedback?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-dark-700">
                  <h4 className="text-sm font-medium text-white mb-3">Feedback</h4>
                  <ul className="space-y-2">
                    {scoreResult.feedback.map((fb, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
                        <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        {fb}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <div className="flex items-center gap-3">
              <select
                value={trendingNiche}
                onChange={(e) => setTrendingNiche(e.target.value)}
                className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
              >
                <option value="creator">Creator</option>
                <option value="tech">Tech</option>
                <option value="fitness">Fitness</option>
                <option value="music">Music</option>
                <option value="business">Business</option>
                <option value="general">General</option>
              </select>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
              <button
                onClick={loadTrending}
                disabled={loadingTrending}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingTrending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                Get Trending
              </button>
            </div>
          </div>

          {trending && (
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <h3 className="text-lg font-medium text-white mb-4">
                Trending in {trending.niche}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trending.trending?.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTopic(topic);
                      setActiveTab('generate');
                    }}
                    className="p-3 bg-dark-700 hover:bg-dark-600 rounded-lg text-left transition-colors group"
                  >
                    <p className="text-white group-hover:text-accent-purple transition-colors">{topic}</p>
                    <p className="text-xs text-dark-400 mt-1">Click to generate</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Folio Tab */}
      {activeTab === 'folio' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                folioConnected ? 'bg-green-500/20' : 'bg-dark-700'
              }`}>
                <Link2 className={`w-5 h-5 ${folioConnected ? 'text-green-400' : 'text-dark-400'}`} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Folio Connection</h3>
                <p className="text-sm text-dark-400">
                  {folioConnected
                    ? `Connected as ${folioUser?.name || folioUser?.email}`
                    : 'Connect to Folio for enhanced AI generation'}
                </p>
              </div>
              {folioConnected && (
                <button
                  onClick={handleFolioLogout}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              )}
            </div>

            {!folioConnected ? (
              <form onSubmit={handleFolioLogin} className="space-y-4">
                <p className="text-sm text-dark-300">
                  Connect your Folio account to use your collections, taste profile, and enhanced AI generation.
                </p>
                {folioError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {folioError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={folioEmail}
                      onChange={(e) => setFolioEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-dark-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={folioPassword}
                      onChange={(e) => setFolioPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={folioLoggingIn}
                    className="px-6 py-2.5 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {folioLoggingIn ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    Connect to Folio
                  </button>
                  <a
                    href="https://folio.subtaste.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-dark-400 hover:text-accent-purple flex items-center gap-1"
                  >
                    Don't have an account? <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Folio Taste Profile */}
                {folioTasteProfile && (
                  <div className="p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Dna className="w-4 h-4 text-accent-purple" />
                      <h4 className="text-sm font-medium text-white">Folio Taste Profile</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {folioTasteProfile.dominantTones && (
                        <div>
                          <p className="text-xs text-dark-400 mb-1">Dominant Tones</p>
                          <div className="flex flex-wrap gap-1">
                            {folioTasteProfile.dominantTones.slice(0, 3).map((tone, i) => (
                              <span key={i} className="px-2 py-0.5 bg-dark-600 rounded text-dark-200 text-xs">
                                {tone}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {folioTasteProfile.preferredHooks && (
                        <div>
                          <p className="text-xs text-dark-400 mb-1">Preferred Hooks</p>
                          <div className="flex flex-wrap gap-1">
                            {folioTasteProfile.preferredHooks.slice(0, 3).map((hook, i) => (
                              <span key={i} className="px-2 py-0.5 bg-dark-600 rounded text-dark-200 text-xs">
                                {hook}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {folioTasteProfile.confidence && (
                        <div>
                          <p className="text-xs text-dark-400 mb-1">Profile Confidence</p>
                          <span className="text-white">{Math.round(folioTasteProfile.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Use Folio Toggle */}
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Use Folio for Generation</p>
                    <p className="text-xs text-dark-400">When enabled, Generate tab will use Folio's AI</p>
                  </div>
                  <button
                    onClick={() => setUseFolioForGeneration(!useFolioForGeneration)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      useFolioForGeneration ? 'bg-accent-purple' : 'bg-dark-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        useFolioForGeneration ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* What is Folio */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="text-lg font-medium text-white mb-3">What is Folio?</h3>
            <p className="text-sm text-dark-300 mb-4">
              Folio is a creative intelligence platform that learns your unique content style from the videos and posts you save.
              It builds a personalized taste profile that helps generate content that matches your aesthetic.
            </p>
            <ul className="space-y-2 text-sm text-dark-300">
              <li className="flex items-start gap-2">
                <Dna className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                <span>Personal taste profile built from your saved content</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                <span>AI-powered content generation matching your style</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />
                <span>Content DNA analysis for hooks, tones, and formats</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentStudio;
