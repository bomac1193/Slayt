import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Loader2, RefreshCw, Download } from 'lucide-react';
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
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-dark-400" />
      </div>
    );
  }

  if (!learningProgress) {
    return (
      <div className="min-h-screen bg-dark-900 text-white p-6">
        <div className="max-w-4xl mx-auto pt-20 text-center">
          <p className="text-dark-500 text-sm">No prediction data yet. Post and track performance to begin.</p>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-medium text-dark-400 uppercase tracking-widest">Prediction Learning</h1>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded px-3 py-1.5 text-sm text-dark-200 focus:outline-none focus:border-dark-500"
            >
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 text-dark-500 hover:text-dark-200 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="p-1.5 text-dark-500 hover:text-dark-200 transition-colors"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-px bg-dark-700 rounded-lg overflow-hidden mb-6">
          <Stat label="Validations" value={totalValidations} sub={`${validations.length} in period`} />
          <Stat label="Avg Accuracy" value={`${Math.round(avgAccuracy)}%`} trend={accuracyTrend} />
          <Stat label="Recent (10)" value={`${Math.round(recentAccuracy)}%`} />
          <Stat label="Adjustments" value={totalAdjustments} sub={`${improvementRate > 0 ? '+' : ''}${improvementRate.toFixed(1)}%`} />
        </div>

        {/* Trend note */}
        {Math.abs(accuracyTrend) > 5 && (
          <div className="text-xs text-dark-500 mb-6 px-1">
            Accuracy {accuracyTrend > 0 ? 'up' : 'down'} {Math.abs(accuracyTrend).toFixed(1)}% this period.
          </div>
        )}

        {/* Chart */}
        <div className="bg-dark-800 rounded-lg p-5 border border-dark-700 mb-6">
          <div className="text-xs text-dark-500 uppercase tracking-wider mb-4">Accuracy over time</div>
          <LearningProgressChart validations={validations} timeRange={timeRange} />
        </div>

        {/* History */}
        <div className="bg-dark-800 rounded-lg p-5 border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-dark-500 uppercase tracking-wider">Validation history</span>
            <span className="text-xs text-dark-600">{validations.length}</span>
          </div>
          <ValidationHistoryTable validations={validations} onRefresh={handleRefresh} />
        </div>
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
          <span className={`flex items-center gap-0.5 text-xs ${trend > 0 ? 'text-dark-100' : 'text-dark-400'}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {sub && !trend && <span className="text-xs text-dark-600">{sub}</span>}
      </div>
    </div>
  );
}

export default LearningDashboard;
