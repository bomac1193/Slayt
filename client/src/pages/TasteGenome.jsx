import { useState, useEffect } from 'react';
import { genomeApi } from '../lib/api';
import {
  Dna,
  Sparkles,
  Trophy,
  Flame,
  Target,
  ChevronRight,
  Zap,
  Lock,
  CheckCircle2,
  Star,
  TrendingUp,
  Award,
  Layers,
  Eye,
  Compass,
  Shield,
  Lightbulb,
  Heart,
  Hexagon,
  Circle,
  Square,
  Triangle,
  Aperture,
} from 'lucide-react';

// Map archetype designations to icons
const ARCHETYPE_ICONS = {
  'T-1': Layers,
  'V-2': Eye,
  'L-3': Compass,
  'C-4': Shield,
  'N-5': Heart,
  'H-6': TrendingUp,
  'P-7': Star,
  'D-8': Zap,
  'F-9': Lightbulb,
  'R-10': Target,
  'S-0': Hexagon,
  'NULL': Aperture,
};

// Map achievement IDs to icons
const ACHIEVEMENT_ICONS = {
  'first-score': Eye,
  'ten-scores': Target,
  'fifty-scores': Award,
  'first-publish': Zap,
  'ten-published': TrendingUp,
  'first-hook': Lightbulb,
  'hook-master': Star,
  'streak-3': Flame,
  'streak-7': Flame,
  'streak-30': Trophy,
  'style-explorer': Compass,
  'hook-explorer': Layers,
  'glyph-revealed': Dna,
};

function ArchetypeCard({ archetype, isActive, confidence }) {
  const IconComponent = ARCHETYPE_ICONS[archetype.designation] || Hexagon;

  return (
    <div
      className={`relative rounded-xl p-4 border transition-all ${
        isActive
          ? 'bg-dark-700 border-accent-purple shadow-lg shadow-accent-purple/20'
          : 'bg-dark-800 border-dark-700 opacity-60'
      }`}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent-purple text-white text-xs rounded-full font-medium">
          {Math.round(confidence * 100)}%
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: archetype.color || '#8b5cf6' }}
        >
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">{archetype.title}</h3>
          <p className="text-xs text-dark-400 font-mono">{archetype.designation}</p>
        </div>
      </div>
      <p className="text-sm text-dark-300 mb-3 line-clamp-2">{archetype.essence}</p>
      <div className="flex flex-wrap gap-1">
        <span className="px-2 py-0.5 bg-dark-600 rounded text-xs text-dark-300">
          {archetype.creativeMode}
        </span>
      </div>
    </div>
  );
}

function AchievementBadge({ achievement, unlocked }) {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.id] || Award;

  return (
    <div
      className={`relative p-3 rounded-lg border transition-all ${
        unlocked
          ? 'bg-dark-700 border-accent-purple/30'
          : 'bg-dark-800 border-dark-700 opacity-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${unlocked ? 'bg-accent-purple/20' : 'bg-dark-700'}`}>
          <IconComponent className={`w-4 h-4 ${unlocked ? 'text-accent-purple' : 'text-dark-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate">{achievement.name}</h4>
          <p className="text-xs text-dark-400 truncate">{achievement.description}</p>
        </div>
        {unlocked ? (
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <Lock className="w-4 h-4 text-dark-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function QuizQuestion({ question, onAnswer, selectedAnswer }) {
  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <p className="text-xl text-white mb-6">{question.prompt}</p>
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onAnswer(question.id, option.value, question.weights[option.value])}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedAnswer === option.value
                ? 'bg-accent-purple/20 border-accent-purple'
                : 'bg-dark-700 border-dark-600 hover:border-dark-500'
            }`}
          >
            <p className="font-medium text-white">{option.label}</p>
            <p className="text-sm text-dark-400 mt-1">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function TasteGenome() {
  const [genome, setGenome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResponses, setQuizResponses] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [allArchetypes, setAllArchetypes] = useState({});
  const [gamification, setGamification] = useState(null);
  const [allAchievements, setAllAchievements] = useState([]);

  useEffect(() => {
    loadGenome();
    loadArchetypes();
  }, []);

  const loadGenome = async () => {
    try {
      const result = await genomeApi.get();
      if (result.hasGenome) {
        setGenome(result.genome);
      }
      const gamResult = await genomeApi.getGamification();
      setGamification(gamResult);
      setAllAchievements(gamResult.allAchievements || []);
    } catch (error) {
      console.error('Failed to load genome:', error);
    } finally {
      setLoading(false);
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

  const startQuiz = async () => {
    try {
      const result = await genomeApi.getQuizQuestions();
      setQuizQuestions(result.questions || []);
      setShowQuiz(true);
      setCurrentQuestion(0);
      setQuizResponses({});
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleQuizAnswer = (questionId, value, weights) => {
    setQuizResponses({
      ...quizResponses,
      [questionId]: { answer: value, weights }
    });
  };

  const submitQuiz = async () => {
    setSubmittingQuiz(true);
    try {
      const responses = Object.entries(quizResponses).map(([questionId, data]) => ({
        questionId,
        answer: data.answer,
        weights: data.weights
      }));
      const result = await genomeApi.submitQuiz(responses);
      setGenome(result.summary?.genome || genome);
      setShowQuiz(false);
      loadGenome();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  // Quiz View
  if (showQuiz && quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestion];
    const isLastQuestion = currentQuestion === quizQuestions.length - 1;
    const allAnswered = Object.keys(quizResponses).length === quizQuestions.length;

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-white">Discover Your Archetype</h1>
            <span className="text-sm text-dark-400 font-mono">
              {currentQuestion + 1}/{quizQuestions.length}
            </span>
          </div>
          <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-purple transition-all"
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <QuizQuestion
          question={question}
          onAnswer={handleQuizAnswer}
          selectedAnswer={quizResponses[question.id]?.answer}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-dark-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          {isLastQuestion ? (
            <button
              onClick={submitQuiz}
              disabled={!allAnswered || submittingQuiz}
              className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submittingQuiz ? 'Analyzing...' : 'Reveal Archetype'}
              <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={!quizResponses[question.id]}
              className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main Genome View
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Dna className="w-7 h-7 text-accent-purple" />
            Taste Genome
          </h1>
          <p className="text-dark-400 mt-1">Your creative DNA profile</p>
        </div>
        <button
          onClick={startQuiz}
          className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {genome ? 'Retake Quiz' : 'Discover Archetype'}
        </button>
      </div>

      {!genome ? (
        // No genome yet
        <div className="text-center py-16 bg-dark-800 rounded-xl border border-dark-700">
          <Dna className="w-16 h-16 text-dark-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Discover Your Creative Archetype</h2>
          <p className="text-dark-400 max-w-md mx-auto mb-6">
            Take a quick 3-question quiz to unlock your unique taste genome and get personalized content recommendations.
          </p>
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Start Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Archetype */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Archetype Card */}
            {genome.archetype?.primary && (
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: genome.archetype.primary.color || '#8b5cf6' }}
                  >
                    {(() => {
                      const IconComponent = ARCHETYPE_ICONS[genome.archetype.primary.designation] || Hexagon;
                      return <IconComponent className="w-8 h-8 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm text-accent-purple font-medium">Primary Archetype</p>
                    <h2 className="text-2xl font-bold text-white">{genome.archetype.primary.title}</h2>
                    <p className="text-dark-400 font-mono text-sm">{genome.archetype.primary.designation}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-bold text-white">
                      {Math.round((genome.archetype.primary.confidence || 0) * 100)}%
                    </p>
                    <p className="text-sm text-dark-400">confidence</p>
                  </div>
                </div>
                <p className="text-dark-300 mb-4">{genome.archetype.primary.essence}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-lg text-sm">
                    {genome.archetype.primary.creativeMode}
                  </span>
                  {genome.archetype.primary.shadow && (
                    <span className="px-3 py-1 bg-dark-700 text-dark-300 rounded-lg text-sm">
                      Shadow: {genome.archetype.primary.shadow}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Secondary Archetype */}
            {genome.archetype?.secondary && (
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <p className="text-sm text-dark-400 mb-2">Secondary Influence</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: genome.archetype.secondary.color || '#6366f1' }}
                  >
                    {(() => {
                      const IconComponent = ARCHETYPE_ICONS[genome.archetype.secondary.designation] || Hexagon;
                      return <IconComponent className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{genome.archetype.secondary.title}</h3>
                    <p className="text-sm text-dark-400">
                      {Math.round((genome.archetype.secondary.confidence || 0) * 100)}% influence
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Archetypes */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">All Archetypes</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(allArchetypes).map(([designation, archetype]) => (
                  <ArchetypeCard
                    key={designation}
                    archetype={{ ...archetype, designation }}
                    isActive={genome.archetype?.primary?.designation === designation}
                    confidence={genome.archetype?.distribution?.[designation] || 0}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Gamification */}
          <div className="space-y-6">
            {/* XP & Tier */}
            {gamification && (
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Current Tier</p>
                    <h3 className="font-semibold text-white">{gamification.tier?.name || 'Nascent'}</h3>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-400">XP</span>
                    <span className="text-white font-mono">{gamification.xp || 0}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-purple transition-all"
                      style={{ width: `${Math.min(100, (gamification.xp || 0) / 20)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <Flame className="w-4 h-4" />
                    <span>{gamification.streak || 0} day streak</span>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements */}
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-purple" />
                Achievements
              </h3>
              <div className="space-y-2">
                {allAchievements.slice(0, 6).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={gamification?.achievements?.some(a => a.id === achievement.id)}
                  />
                ))}
              </div>
            </div>

            {/* Top Keywords */}
            {genome?.keywords && (
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Top Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(genome.keywords.visual || {})
                    .flatMap(([cat, keywords]) =>
                      Object.entries(keywords)
                        .filter(([, score]) => score > 0.5)
                        .map(([kw, score]) => ({ keyword: kw, score }))
                    )
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map(({ keyword, score }) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-dark-700 rounded text-sm text-dark-200"
                        title={`Score: ${score.toFixed(2)}`}
                      >
                        {keyword}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TasteGenome;
