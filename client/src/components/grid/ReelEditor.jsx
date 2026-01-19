import { useState, useEffect, useRef } from 'react';
import { X, Play, Image, Music, Hash, MapPin, AtSign, Clock, Save, Trash2, ChevronDown, Heart, MessageCircle, Bookmark, Share2, Disc } from 'lucide-react';
import { formatDuration } from '../../utils/videoUtils';
import { useAppStore } from '../../stores/useAppStore';

/**
 * Editor component for editing reel details
 * Allows editing caption, hashtags, audio, location, mentions, etc.
 */
function ReelEditor({ reel, onSave, onDelete, onClose, onChangeThumbnail, onPlay }) {
  const user = useAppStore((state) => state.user);
  const [caption, setCaption] = useState(reel?.caption || '');
  const [hashtags, setHashtags] = useState(reel?.hashtags?.join(' ') || '');
  const [location, setLocation] = useState(reel?.location || '');
  const [mentions, setMentions] = useState(reel?.mentions?.join(' ') || '');
  const [audioTrack, setAudioTrack] = useState(reel?.audioTrack || '');
  const [scheduledFor, setScheduledFor] = useState(reel?.scheduledFor ? new Date(reel.scheduledFor).toISOString().slice(0, 16) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState('caption');

  // Inline video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Toggle play/pause inline
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Character limits (Instagram)
  const CAPTION_LIMIT = 2200;
  const HASHTAG_LIMIT = 30;

  // Count hashtags
  const hashtagCount = hashtags.trim() ? hashtags.trim().split(/\s+/).filter(h => h.startsWith('#') || h.length > 0).length : 0;

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        caption: caption.trim(),
        hashtags: hashtags.trim().split(/\s+/).filter(h => h).map(h => h.startsWith('#') ? h : `#${h}`),
        location: location.trim(),
        mentions: mentions.trim().split(/\s+/).filter(m => m).map(m => m.startsWith('@') ? m : `@${m}`),
        audioTrack: audioTrack.trim(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      };
      await onSave(updates);
    } catch (err) {
      console.error('Failed to save reel:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await onDelete();
    } catch (err) {
      console.error('Failed to delete reel:', err);
      alert('Failed to delete reel. Please try again.');
    }
  };

  // Fake engagement stats for preview
  const fakeStats = {
    likes: '12.5K',
    comments: '342',
    bookmarks: '1.2K',
    shares: '89',
  };

  // Realistic TikTok-style comments with emojis
  const fakeComments = [
    { user: 'emma.designs', text: 'obsessed with this 😍🔥' },
    { user: 'creativejay', text: 'tutorial pls!! 🙏' },
    { user: 'viralqueen_', text: 'POV: perfection 💅✨' },
    { user: 'contentking', text: 'this is everything 😭💕' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-dark-700 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side - TikTok-style Video preview */}
        <div className="flex-1 bg-black flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="relative h-full max-h-[70vh] aspect-[9/16] bg-dark-900 rounded-xl overflow-hidden shadow-2xl">
              {/* Video - inline playback */}
              {reel?.mediaUrl ? (
                <video
                  ref={videoRef}
                  src={reel.mediaUrl}
                  poster={reel.thumbnailUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : reel?.thumbnailUrl ? (
                <img
                  src={reel.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                  <span className="text-dark-500">No preview</span>
                </div>
              )}

              {/* Play button overlay - only show when paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                    <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                  </div>
                </button>
              )}

              {/* Right side engagement buttons */}
              <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 pointer-events-none">
                {/* Like */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-dark-800/60 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] mt-0.5 font-medium">{fakeStats.likes}</span>
                </div>
                {/* Comment */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-dark-800/60 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] mt-0.5 font-medium">{fakeStats.comments}</span>
                </div>
                {/* Bookmark */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-dark-800/60 rounded-full flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] mt-0.5 font-medium">{fakeStats.bookmarks}</span>
                </div>
                {/* Share */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 bg-dark-800/60 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] mt-0.5 font-medium">{fakeStats.shares}</span>
                </div>
                {/* Music disc */}
                <div
                  className="w-9 h-9 bg-gradient-to-br from-dark-600 to-dark-800 rounded-full flex items-center justify-center border-2 border-dark-500"
                  style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}
                >
                  <Disc className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* TikTok-style comments - bottom left, above user info */}
              <div className="absolute left-2 bottom-[72px] right-12 space-y-1 pointer-events-none">
                {fakeComments.map((comment, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 w-fit max-w-full"
                    style={{ opacity: 1 - (i * 0.15) }}
                  >
                    <span className="text-white text-[10px] font-semibold shrink-0">{comment.user}</span>
                    <span className="text-white/90 text-[10px] truncate">{comment.text}</span>
                  </div>
                ))}
              </div>

              {/* Bottom overlay - user info & caption */}
              <div className="absolute left-2 right-12 bottom-2 pointer-events-none">
                <p className="text-white font-bold text-xs mb-0.5">{user?.username || user?.brandName || 'username'}</p>
                <p className="text-white/90 text-[10px] line-clamp-2 leading-tight">
                  {caption || 'Your caption will appear here...'}
                </p>
                {/* Music info */}
                <div className="flex items-center gap-1 mt-1.5">
                  <Music className="w-3 h-3 text-white" />
                  <div className="overflow-hidden">
                    <p className="text-white/80 text-[10px] truncate animate-marquee">
                      ♫ {audioTrack || 'Original audio - your_username'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration badge */}
              {reel?.metadata?.duration && (
                <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white pointer-events-none">
                  {formatDuration(reel.metadata.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail change button */}
          <div className="px-4 pb-4">
            <button
              onClick={onChangeThumbnail}
              className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Image className="w-4 h-4" />
              Change Thumbnail
            </button>
          </div>
        </div>

        {/* Right side - Editor (narrower) */}
        <div className="w-72 flex-shrink-0 flex flex-col border-l border-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-dark-700">
            <h3 className="text-sm font-medium text-dark-100">Edit Details</h3>
            <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Caption */}
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-dark-400 mb-1">
                <span>Caption</span>
                <span className={caption.length > CAPTION_LIMIT ? 'text-red-400' : ''}>
                  {caption.length}/{CAPTION_LIMIT}
                </span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Hashtags */}
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-dark-400 mb-1">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Hashtags
                </span>
                <span className={hashtagCount > HASHTAG_LIMIT ? 'text-red-400' : ''}>
                  {hashtagCount}/{HASHTAG_LIMIT}
                </span>
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#viral #trending"
                rows={2}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Audio/Song */}
            <div className="mb-3">
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <Music className="w-3 h-3" />
                Audio
              </label>
              <input
                type="text"
                value={audioTrack}
                onChange={(e) => setAudioTrack(e.target.value)}
                placeholder="Original audio"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Location */}
            <div className="mb-3">
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Mentions */}
            <div className="mb-3">
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <AtSign className="w-3 h-3" />
                Mentions
              </label>
              <input
                type="text"
                value={mentions}
                onChange={(e) => setMentions(e.target.value)}
                placeholder="@username"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Schedule */}
            <div className="mb-3">
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <Clock className="w-3 h-3" />
                Schedule
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Metadata info */}
            {reel?.metadata && (
              <div className="p-2 bg-dark-700/50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1.5 font-medium">Video Info</p>
                <div className="space-y-0.5 text-xs">
                  {reel.metadata.width && reel.metadata.height && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Resolution</span>
                      <span className="text-dark-300">{reel.metadata.width}x{reel.metadata.height}</span>
                    </div>
                  )}
                  {reel.metadata.duration && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Duration</span>
                      <span className="text-dark-300">{formatDuration(reel.metadata.duration)}</span>
                    </div>
                  )}
                  {reel.metadata.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Size</span>
                      <span className="text-dark-300">{(reel.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-dark-700 space-y-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-dark-600 disabled:text-dark-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-dark-800 rounded-xl p-6 w-full max-w-sm border border-dark-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-medium text-dark-100 mb-2">Delete Reel?</h4>
              <p className="text-dark-400 text-sm mb-4">
                This will permanently delete this reel. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReelEditor;
