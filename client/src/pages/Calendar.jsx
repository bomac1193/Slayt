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
  Flag,
  Target,
  Folder,
  Layers,
  Youtube,
  Film,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { postingApi, collectionApi, contentApi, rolloutApi, gridApi, reelCollectionApi } from '../lib/api';

// TikTok icon component
function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar() {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [rolloutEvents, setRolloutEvents] = useState([]);
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

  // Multi-tab modal state
  const [modalTab, setModalTab] = useState('post'); // 'post' | 'collection' | 'rollout'

  // Collection scheduling state
  const [availableCollections, setAvailableCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionEndDate, setCollectionEndDate] = useState('');
  const [postingInterval, setPostingInterval] = useState('daily');
  const [postingTimes, setPostingTimes] = useState(['12:00']);

  // Rollout scheduling state
  const [availableRollouts, setAvailableRollouts] = useState([]);
  const [selectedRollout, setSelectedRollout] = useState(null);
  const [rolloutEndDate, setRolloutEndDate] = useState('');
  const [activateRollout, setActivateRollout] = useState(false);

  // Show legend
  const [showLegend, setShowLegend] = useState(true);

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

  // Fetch rollout events for calendar
  const fetchRolloutEvents = useCallback(async () => {
    try {
      const data = await rolloutApi.getScheduledRollouts();
      setRolloutEvents(data?.events || []);
    } catch (err) {
      // Silently fail - rollout events are optional
      console.error('Failed to fetch rollout events:', err);
      setRolloutEvents([]);
    }
  }, []);

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

  useEffect(() => {
    fetchScheduledPosts();
    fetchRolloutEvents();
  }, [fetchScheduledPosts, fetchRolloutEvents]);

  // Fetch available collections and rollouts
  const fetchCollectionsAndRollouts = useCallback(async () => {
    try {
      // Fetch grids, reel collections, and rollouts in parallel
      const [gridsData, reelCollectionsData, rolloutsData] = await Promise.all([
        gridApi.getAll().catch(() => ({ grids: [] })),
        reelCollectionApi.getAll().catch(() => []),
        rolloutApi.getAll().catch(() => ({ rollouts: [] })),
      ]);

      // Combine collections
      const grids = gridsData.grids || [];
      const reelCollections = reelCollectionsData || [];

      const collections = [
        ...grids.map(g => ({
          id: g._id,
          name: g.name,
          platform: g.platform || 'instagram',
          type: 'grid',
          itemCount: g.cells?.filter(c => !c.isEmpty).length || 0,
        })),
        ...reelCollections.map(rc => ({
          id: rc._id,
          name: rc.name,
          platform: rc.platform,
          type: 'reel',
          itemCount: rc.reels?.length || 0,
        })),
      ];

      setAvailableCollections(collections);
      setAvailableRollouts(rolloutsData.rollouts || []);
    } catch (err) {
      console.error('Failed to fetch collections/rollouts:', err);
    }
  }, []);

  // Handle opening schedule modal (from button - uses tomorrow's date)
  const handleOpenScheduleModal = useCallback(() => {
    fetchAvailableContent();
    fetchCollectionsAndRollouts();
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setCollectionEndDate('');
    setRolloutEndDate('');
    setScheduleTime('12:00');
    setSelectedContent(null);
    setSelectedCollection(null);
    setSelectedRollout(null);
    setSelectedPlatforms(['instagram']);
    setPostingInterval('daily');
    setPostingTimes(['12:00']);
    setActivateRollout(false);
    setModalTab('post');
    setShowScheduleModal(true);
  }, [fetchAvailableContent, fetchCollectionsAndRollouts]);

  // Handle clicking on a calendar day
  const handleDayClick = useCallback((date) => {
    fetchAvailableContent();
    fetchCollectionsAndRollouts();
    // Use clicked date
    setScheduleDate(date.toISOString().split('T')[0]);
    setCollectionEndDate('');
    setRolloutEndDate('');
    setScheduleTime('12:00');
    setSelectedContent(null);
    setSelectedCollection(null);
    setSelectedRollout(null);
    setSelectedPlatforms(['instagram']);
    setPostingInterval('daily');
    setPostingTimes(['12:00']);
    setActivateRollout(false);
    setModalTab('post');
    setShowScheduleModal(true);
  }, [fetchAvailableContent, fetchCollectionsAndRollouts]);

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

  // Get rollout events for a specific day
  const getRolloutEventsForDay = (date) => {
    return rolloutEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Handle scheduling a collection
  const handleScheduleCollection = useCallback(async () => {
    if (!selectedCollection || !scheduleDate) return;

    setScheduling(true);
    try {
      await collectionApi.schedule(selectedCollection.id, {
        startDate: new Date(scheduleDate).toISOString(),
        endDate: collectionEndDate ? new Date(collectionEndDate).toISOString() : null,
        interval: postingInterval,
        postingTimes: postingTimes,
        platforms: selectedPlatforms,
      });
      setShowScheduleModal(false);
      fetchScheduledPosts();
    } catch (err) {
      console.error('Failed to schedule collection:', err);
      alert('Failed to schedule collection. Please try again.');
    } finally {
      setScheduling(false);
    }
  }, [selectedCollection, scheduleDate, collectionEndDate, postingInterval, postingTimes, selectedPlatforms, fetchScheduledPosts]);

  // Handle scheduling a rollout
  const handleScheduleRollout = useCallback(async () => {
    if (!selectedRollout || !scheduleDate) return;

    setScheduling(true);
    try {
      await rolloutApi.scheduleRollout(selectedRollout._id || selectedRollout.id, {
        startDate: new Date(scheduleDate).toISOString(),
        endDate: rolloutEndDate ? new Date(rolloutEndDate).toISOString() : null,
        activate: activateRollout,
      });
      setShowScheduleModal(false);
      fetchRolloutEvents();
    } catch (err) {
      console.error('Failed to schedule rollout:', err);
      alert('Failed to schedule rollout. Please try again.');
    } finally {
      setScheduling(false);
    }
  }, [selectedRollout, scheduleDate, rolloutEndDate, activateRollout, fetchRolloutEvents]);

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
            Schedule
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
            const dayRolloutEvents = getRolloutEventsForDay(day.date);
            const isTodayCell = isToday(day.date);
            const totalItems = posts.length + dayRolloutEvents.length;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day.date)}
                className={`min-h-[120px] border-b border-r border-dark-700 p-2 transition-colors hover:bg-dark-700/50 cursor-pointer ${
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

                {/* Events */}
                <div className="space-y-1">
                  {/* Rollout Events */}
                  {dayRolloutEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 p-1.5 rounded text-xs truncate"
                      style={{
                        backgroundColor: `${event.color}20`,
                        borderLeft: `2px solid ${event.color}`,
                      }}
                    >
                      {event.type.includes('start') ? (
                        <Flag className="w-3 h-3 flex-shrink-0" style={{ color: event.color }} />
                      ) : (
                        <Target className="w-3 h-3 flex-shrink-0" style={{ color: event.color }} />
                      )}
                      <span className="truncate flex-1" style={{ color: event.color }}>
                        {event.type.includes('section') ? event.sectionName : event.rolloutName}
                      </span>
                    </div>
                  ))}

                  {/* Posts */}
                  {posts.slice(0, dayRolloutEvents.length > 1 ? 1 : 2).map((post) => (
                    <div
                      key={post.id}
                      onClick={(e) => e.stopPropagation()}
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

                  {/* Overflow indicator */}
                  {totalItems > 3 && (
                    <span className="text-xs text-dark-400">
                      +{totalItems - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats & Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-dark-400">
            <CalendarIcon className="w-4 h-4" />
            <span>{scheduledPosts.length} scheduled posts</span>
          </div>
          <div className="flex items-center gap-2 text-dark-400">
            <Layers className="w-4 h-4" />
            <span>{rolloutEvents.length} rollout events</span>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center gap-4 text-xs text-dark-400">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-dark-600 rounded flex items-center justify-center">
                <Image className="w-2.5 h-2.5" />
              </div>
              <span>Post</span>
            </div>
            <div className="flex items-center gap-1">
              <Flag className="w-4 h-4 text-green-400" />
              <span>Start</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-orange-400" />
              <span>Deadline</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-dark-500 hover:text-dark-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Multi-Tab Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div>
                <h3 className="text-lg font-semibold text-dark-100">
                  Schedule for: {scheduleDate ? new Date(scheduleDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Select a date'}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-dark-700">
              <button
                onClick={() => setModalTab('post')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  modalTab === 'post'
                    ? 'text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
                }`}
              >
                <Image className="w-4 h-4" />
                Post
              </button>
              <button
                onClick={() => setModalTab('collection')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  modalTab === 'collection'
                    ? 'text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
                }`}
              >
                <Folder className="w-4 h-4" />
                Collection
              </button>
              <button
                onClick={() => setModalTab('rollout')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  modalTab === 'rollout'
                    ? 'text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                Rollout
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* POST TAB */}
              {modalTab === 'post' && (
                <>
                  {/* Select Content */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Select Content
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-auto">
                      {availableContent.length === 0 ? (
                        <p className="col-span-4 text-center text-dark-400 py-4">
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

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="input w-full max-w-xs"
                    />
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'].map((platform) => (
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
                </>
              )}

              {/* COLLECTION TAB */}
              {modalTab === 'collection' && (
                <>
                  {/* Select Collection */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Select Collection
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                      {availableCollections.length === 0 ? (
                        <p className="col-span-2 text-center text-dark-400 py-4">
                          No collections available. Create a collection first.
                        </p>
                      ) : (
                        availableCollections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => setSelectedCollection(collection)}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                              selectedCollection?.id === collection.id
                                ? 'border-accent-purple bg-accent-purple/10'
                                : 'border-dark-600 hover:border-dark-500'
                            }`}
                          >
                            <div className="w-8 h-8 rounded bg-dark-600 flex items-center justify-center">
                              {collection.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-400" />}
                              {collection.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                              {collection.platform === 'tiktok' && <TikTokIcon className="w-4 h-4 text-cyan-400" />}
                              {collection.type === 'reel' && <Film className="w-4 h-4 text-purple-400" />}
                              {!['youtube', 'instagram', 'tiktok'].includes(collection.platform) && collection.type !== 'reel' && (
                                <Folder className="w-4 h-4 text-dark-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{collection.name}</div>
                              <div className="text-xs text-dark-400">{collection.itemCount} items</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        Start Date
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
                        End Date (optional)
                      </label>
                      <input
                        type="date"
                        value={collectionEndDate}
                        onChange={(e) => setCollectionEndDate(e.target.value)}
                        className="input w-full"
                        min={scheduleDate}
                      />
                    </div>
                  </div>

                  {/* Posting Interval */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Posting Interval
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'daily', label: 'Daily' },
                        { id: 'every-other-day', label: 'Every Other Day' },
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'custom', label: 'Custom' },
                      ].map((interval) => (
                        <button
                          key={interval.id}
                          onClick={() => setPostingInterval(interval.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            postingInterval === interval.id
                              ? 'bg-accent-purple text-white'
                              : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                          }`}
                        >
                          {interval.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Posting Times */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Posting Time(s)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={postingTimes[0] || '12:00'}
                        onChange={(e) => setPostingTimes([e.target.value, ...postingTimes.slice(1)])}
                        className="input"
                      />
                      <button
                        onClick={() => setPostingTimes([...postingTimes, '18:00'])}
                        className="btn-ghost text-sm"
                      >
                        + Add time
                      </button>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Platforms
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'].map((platform) => (
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
                </>
              )}

              {/* ROLLOUT TAB */}
              {modalTab === 'rollout' && (
                <>
                  {/* Select Rollout */}
                  <div>
                    <label className="block text-sm font-medium text-dark-200 mb-2">
                      Select Rollout
                    </label>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {availableRollouts.length === 0 ? (
                        <p className="text-center text-dark-400 py-4">
                          No rollouts available. Create a rollout first.
                        </p>
                      ) : (
                        availableRollouts.map((rollout) => (
                          <button
                            key={rollout._id || rollout.id}
                            onClick={() => setSelectedRollout(rollout)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                              selectedRollout?._id === rollout._id || selectedRollout?.id === rollout.id
                                ? 'border-accent-purple bg-accent-purple/10'
                                : 'border-dark-600 hover:border-dark-500'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center">
                              <Layers className="w-5 h-5 text-accent-purple" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white">{rollout.name}</div>
                              <div className="text-xs text-dark-400">
                                {rollout.sections?.length || 0} sections
                                <span className={`ml-2 px-1.5 py-0.5 rounded ${
                                  rollout.status === 'active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : rollout.status === 'completed'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-dark-600 text-dark-400'
                                }`}>
                                  {rollout.status}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Rollout Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        <Flag className="w-4 h-4 inline mr-1" />
                        Start Date
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
                        <Target className="w-4 h-4 inline mr-1" />
                        Deadline (optional)
                      </label>
                      <input
                        type="date"
                        value={rolloutEndDate}
                        onChange={(e) => setRolloutEndDate(e.target.value)}
                        className="input w-full"
                        min={scheduleDate}
                      />
                    </div>
                  </div>

                  {/* Activate Toggle */}
                  <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                    <input
                      type="checkbox"
                      id="activateRollout"
                      checked={activateRollout}
                      onChange={(e) => setActivateRollout(e.target.checked)}
                      className="w-4 h-4 rounded border-dark-500"
                    />
                    <label htmlFor="activateRollout" className="text-sm text-dark-200">
                      Activate rollout immediately
                    </label>
                  </div>

                  {/* Section deadlines info */}
                  {selectedRollout && selectedRollout.sections?.length > 0 && (
                    <div className="text-xs text-dark-400 p-3 bg-dark-700/50 rounded-lg">
                      <p className="mb-2">Sections in this rollout:</p>
                      <ul className="space-y-1">
                        {selectedRollout.sections.map((section) => (
                          <li key={section.id} className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: section.color || '#6366f1' }}
                            />
                            <span>{section.name}</span>
                            {section.deadline && (
                              <span className="text-dark-500">
                                (Due: {new Date(section.deadline).toLocaleDateString()})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-dark-500">
                        Set section deadlines in the Rollout Planner.
                      </p>
                    </div>
                  )}
                </>
              )}
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
                onClick={
                  modalTab === 'post'
                    ? handleSchedulePost
                    : modalTab === 'collection'
                    ? handleScheduleCollection
                    : handleScheduleRollout
                }
                disabled={
                  scheduling ||
                  (modalTab === 'post' && (!selectedContent || !scheduleTime)) ||
                  (modalTab === 'collection' && !selectedCollection) ||
                  (modalTab === 'rollout' && !selectedRollout)
                }
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
                    Schedule {modalTab === 'post' ? 'Post' : modalTab === 'collection' ? 'Collection' : 'Rollout'}
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
