import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  X,
  Image,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { postingApi, collectionApi, contentApi } from '../lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar() {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week' | 'day'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableContent, setAvailableContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
  const [scheduling, setScheduling] = useState(false);

  // Fetch scheduled posts from backend
  const fetchScheduledPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postingApi.getScheduled();
      const posts = Array.isArray(data) ? data : data.posts || data.scheduled || [];
      setScheduledPosts(posts);
    } catch (err) {
      console.error('Failed to fetch scheduled posts:', err);
      // Don't show error for empty/404 - just show empty calendar
      if (err.response?.status !== 404) {
        setError(err.message || 'Failed to load scheduled posts');
      }
      setScheduledPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  // Fetch available content for scheduling
  const fetchAvailableContent = useCallback(async () => {
    try {
      const data = await contentApi.getAll();
      const content = Array.isArray(data) ? data : data.content || [];
      setAvailableContent(content);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setAvailableContent([]);
    }
  }, []);

  // Handle opening schedule modal
  const handleOpenScheduleModal = useCallback(() => {
    fetchAvailableContent();
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('12:00');
    setSelectedContent(null);
    setSelectedPlatforms(['instagram']);
    setShowScheduleModal(true);
  }, [fetchAvailableContent]);

  // Handle scheduling a post
  const handleSchedulePost = useCallback(async () => {
    if (!selectedContent || !scheduleDate || !scheduleTime) return;

    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      await postingApi.schedulePost(selectedContent._id || selectedContent.id, selectedPlatforms, scheduledAt.toISOString());
      setShowScheduleModal(false);
      fetchScheduledPosts();
    } catch (err) {
      console.error('Failed to schedule post:', err);
      alert('Failed to schedule post. Please try again.');
    } finally {
      setScheduling(false);
    }
  }, [selectedContent, scheduleDate, scheduleTime, selectedPlatforms, fetchScheduledPosts]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const { year, month, daysInMonth, firstDayOfMonth, today } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();

    return { year, month, daysInMonth, firstDayOfMonth, today };
  }, [currentDate]);

  const days = useMemo(() => {
    const result = [];
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      result.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      result.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }
    // Next month days
    const remainingDays = 42 - result.length;
    for (let i = 1; i <= remainingDays; i++) {
      result.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }
    return result;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  const getPostsForDay = (date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-semibold text-dark-100">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="btn-icon"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-ghost text-sm"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="btn-icon"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-dark-800 rounded-lg">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  view === v
                    ? 'bg-accent-purple text-white'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button onClick={fetchScheduledPosts} className="btn-icon" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={handleOpenScheduleModal} className="btn-primary">
            <Plus className="w-4 h-4" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
          {error}
          <button onClick={fetchScheduledPosts} className="ml-4 underline">
            Retry
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-dark-700">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-dark-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 grid-rows-6 flex-1">
          {days.map((day, index) => {
            const posts = getPostsForDay(day.date);
            const isTodayCell = isToday(day.date);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-dark-700 p-2 transition-colors hover:bg-dark-700/50 ${
                  !day.isCurrentMonth ? 'bg-dark-900/50' : ''
                } ${isTodayCell ? 'bg-accent-purple/10' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm ${
                      !day.isCurrentMonth
                        ? 'text-dark-500'
                        : isTodayCell
                        ? 'text-accent-purple font-semibold'
                        : 'text-dark-300'
                    }`}
                  >
                    {day.day}
                  </span>
                  {isTodayCell && (
                    <span className="text-xs bg-accent-purple text-white px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Posts */}
                <div className="space-y-1">
                  {posts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-1.5 p-1.5 bg-dark-600 rounded text-xs truncate cursor-pointer hover:bg-dark-500"
                    >
                      {post.image ? (
                        <img
                          src={post.image}
                          alt=""
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded"
                          style={{ backgroundColor: post.color }}
                        />
                      )}
                      <span className="text-dark-200 truncate flex-1">
                        {post.caption?.slice(0, 20) || 'Untitled'}
                      </span>
                      <Clock className="w-3 h-3 text-dark-400" />
                    </div>
                  ))}
                  {posts.length > 3 && (
                    <span className="text-xs text-dark-400">
                      +{posts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-dark-400">
          <CalendarIcon className="w-4 h-4" />
          <span>{scheduledPosts.length} scheduled posts</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <Clock className="w-4 h-4" />
          <span>
            Next post: {scheduledPosts[0]
              ? new Date(scheduledPosts[0].scheduledAt).toLocaleString()
              : 'None scheduled'}
          </span>
        </div>
        <span className="ml-auto text-dark-500">
          Data from MongoDB
        </span>
      </div>

      {/* Schedule Post Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-dark-100">Schedule Post</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Select Content */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Select Content
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto">
                  {availableContent.length === 0 ? (
                    <p className="col-span-3 text-center text-dark-400 py-4">
                      No content available. Upload content first.
                    </p>
                  ) : (
                    availableContent.map((content) => (
                      <button
                        key={content._id || content.id}
                        onClick={() => setSelectedContent(content)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedContent?._id === content._id || selectedContent?.id === content.id
                            ? 'border-accent-purple'
                            : 'border-transparent hover:border-dark-500'
                        }`}
                      >
                        {content.mediaUrl || content.image ? (
                          <img
                            src={content.mediaUrl || content.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                            <Image className="w-8 h-8 text-dark-500" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {['instagram', 'tiktok', 'twitter', 'facebook'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                        selectedPlatforms.includes(platform)
                          ? 'bg-accent-purple text-white'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-700 flex gap-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePost}
                disabled={!selectedContent || !scheduleDate || !scheduleTime || scheduling}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" />
                    Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
