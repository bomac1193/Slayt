import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { performanceApi } from '../lib/api';
import { LearningProgressChart, ValidationHistoryTable } from '../components/conviction';

function LearningDashboard() {
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const [loading, setLoading] = useState(true);
  const [learningProgress, setLearningProgress] = useState(null);
  const [validations, setValidations] = useState([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentProfileId, timeRange]);

  const fetchDashboardData = async () => {
    if (!currentProfileId) return;
    try {
      setLoading(true);
      const progressData = await performanceApi.getLearningProgress(currentProfileId);
      setLearningProgress(progressData);
      const validationsData = await performanceApi.getValidationHistory(currentProfileId, {
        timeRange,
        limit: 50
      });
      setValidations(validationsData.validations || []);
    } catch (error) {
      console.error('Failed to fetch learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ progress: learningProgress, validations, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-dark-400" />
      </div>
    );
  }

  if (!learningProgress) {
    return (
      <div className="mx-auto max-w-4xl pt-20 text-center">
        <p className="text-dark-500 text-sm">No prediction data yet. Post and track performance to begin.</p>
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
    <div className="mx-auto max-w-5xl pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-lg font-sans font-medium text-dark-100 tracking-tight">Learning</div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-8 border border-dark-700 bg-dark-800 px-2 text-xs text-dark-200 outline-none"
          >
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 flex items-center justify-center border border-dark-700 text-dark-400 hover:text-dark-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="h-8 px-3 text-xs border border-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-px bg-dark-700 overflow-hidden mb-5">
        <Stat label="Validations" value={totalValidations} sub={`${validations.length} in period`} />
        <Stat label="Avg accuracy" value={`${Math.round(avgAccuracy)}%`} trend={accuracyTrend} />
        <Stat label="Recent (10)" value={`${Math.round(recentAccuracy)}%`} />
        <Stat label="Adjustments" value={totalAdjustments} sub={`${improvementRate > 0 ? '+' : ''}${improvementRate.toFixed(1)}%`} />
      </div>

      {/* Trend note */}
      {Math.abs(accuracyTrend) > 5 && (
        <div className="text-xs text-dark-500 mb-5 px-1">
          Accuracy {accuracyTrend > 0 ? 'up' : 'down'} {Math.abs(accuracyTrend).toFixed(1)}% this period.
        </div>
      )}

      {/* Chart */}
      <div className="bg-dark-800 p-5 border border-dark-700 mb-5">
        <div className="text-xs text-dark-500 mb-4">Accuracy over time</div>
        <LearningProgressChart validations={validations} timeRange={timeRange} />
      </div>

      {/* History */}
      <div className="bg-dark-800 p-5 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-dark-500">Validation history</span>
          <span className="text-xs text-dark-600">{validations.length}</span>
        </div>
        <ValidationHistoryTable validations={validations} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}

function Stat({ label, value, trend, sub }) {
  return (
    <div className="bg-dark-800 p-4">
      <div className="text-xs text-dark-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-white">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs ${trend > 0 ? 'text-dark-100' : 'text-dark-400'}`}>
            {trend > 0 ? '+' : ''}{Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {sub && !trend && <span className="text-xs text-dark-600">{sub}</span>}
      </div>
    </div>
  );
}

export default LearningDashboard;
