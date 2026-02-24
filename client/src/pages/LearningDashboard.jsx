import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  Target,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { performanceApi } from '../lib/api';
import { LearningProgressChart, ValidationHistoryTable } from '../components/conviction';

function LearningDashboard() {
  const { user, activeProfile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [learningProgress, setLearningProgress] = useState(null);
  const [validations, setValidations] = useState([]);
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', 'all'
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [activeProfile, timeRange]);

  const fetchDashboardData = async () => {
    if (!activeProfile) return;

    try {
      setLoading(true);

      // Fetch learning progress stats
      const progressData = await performanceApi.getLearningProgress(activeProfile);
      setLearningProgress(progressData);

      // Fetch validation history
      const validationsData = await performanceApi.getValidationHistory(activeProfile, {
        timeRange,
        limit: 50
      });
      setValidations(validationsData.validations || []);
    } catch (error) {
      console.error('Failed to fetch learning dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleExportData = () => {
    // Export learning data as JSON
    const exportData = {
      progress: learningProgress,
      validations,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-purple mx-auto mb-4" />
          <p className="text-gray-400">Loading learning dashboard...</p>
        </div>
      </div>
    );
  }

  if (!learningProgress) {
    return (
      <div className="min-h-screen bg-dark-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No Learning Data Yet</h2>
            <p className="text-gray-500 mb-6">
              Start scheduling posts to build your conviction loop learning history
            </p>
            <a
              href="/calendar"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-dark transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Go to Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalValidations = 0,
    avgAccuracy = 0,
    accuracyTrend = 0,
    improvementRate = 0,
    recentAccuracy = 0,
    totalAdjustments = 0
  } = learningProgress;

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Brain className="w-8 h-8 text-accent-purple" />
              Learning Dashboard
            </h1>
            <p className="text-gray-400">
              Track how conviction predictions improve over time
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-purple"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export Button */}
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Validations */}
          <StatCard
            icon={Target}
            iconColor="text-blue-400"
            label="Total Validations"
            value={totalValidations}
            subtitle={`${validations.length} in ${timeRange}`}
          />

          {/* Average Accuracy */}
          <StatCard
            icon={Zap}
            iconColor="text-yellow-400"
            label="Avg Accuracy"
            value={`${Math.round(avgAccuracy)}%`}
            trend={accuracyTrend}
            subtitle={accuracyTrend > 0 ? 'Improving' : accuracyTrend < 0 ? 'Declining' : 'Stable'}
          />

          {/* Recent Accuracy */}
          <StatCard
            icon={TrendingUp}
            iconColor="text-green-400"
            label="Recent Accuracy"
            value={`${Math.round(recentAccuracy)}%`}
            subtitle="Last 10 predictions"
          />

          {/* Genome Adjustments */}
          <StatCard
            icon={Brain}
            iconColor="text-purple-400"
            label="Genome Adjustments"
            value={totalAdjustments}
            subtitle={`${improvementRate > 0 ? '+' : ''}${improvementRate.toFixed(1)}% improvement`}
          />
        </div>

        {/* Learning Insight Banner */}
        {accuracyTrend > 5 && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-300 mb-1">
                  Your genome is learning.
                </h3>
                <p className="text-green-200 text-sm">
                  Prediction accuracy has improved by {accuracyTrend.toFixed(1)}% over the selected period.
                  Keep posting to continue training your taste intelligence.
                </p>
              </div>
            </div>
          </div>
        )}

        {accuracyTrend < -5 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-300 mb-1">
                  Prediction accuracy is declining
                </h3>
                <p className="text-orange-200 text-sm">
                  Your content style may be shifting. Review recent posts to ensure they align with your taste genome.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Progress Chart */}
        <div className="mb-8">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-purple" />
                Prediction Accuracy Over Time
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info className="w-4 h-4" />
                <span>How well Atelio predicts your content performance</span>
              </div>
            </div>
            <LearningProgressChart
              validations={validations}
              timeRange={timeRange}
            />
          </div>
        </div>

        {/* Validation History Table */}
        <div>
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-purple" />
                Validation History
              </h2>
              <div className="text-sm text-gray-400">
                {validations.length} validations in {timeRange}
              </div>
            </div>
            <ValidationHistoryTable
              validations={validations}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, iconColor, label, value, trend, subtitle }) {
  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 ${iconColor}`} />
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  );
}

export default LearningDashboard;
