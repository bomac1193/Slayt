import { useState, useEffect } from 'react';
import { X, Play, Image, Music, Hash, MapPin, AtSign, Clock, Save, Trash2, ChevronDown } from 'lucide-react';
import { formatDuration } from '../../utils/videoUtils';

/**
 * Editor component for editing reel details
 * Allows editing caption, hashtags, audio, location, mentions, etc.
 */
function ReelEditor({ reel, onSave, onDelete, onClose, onChangeThumbnail, onPlay }) {
  const [caption, setCaption] = useState(reel?.caption || '');
  const [hashtags, setHashtags] = useState(reel?.hashtags?.join(' ') || '');
  const [location, setLocation] = useState(reel?.location || '');
  const [mentions, setMentions] = useState(reel?.mentions?.join(' ') || '');
  const [audioTrack, setAudioTrack] = useState(reel?.audioTrack || '');
  const [scheduledFor, setScheduledFor] = useState(reel?.scheduledFor ? new Date(reel.scheduledFor).toISOString().slice(0, 16) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState('caption');

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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-700 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side - Video preview */}
        <div className="w-80 flex-shrink-0 bg-black flex flex-col">
          {/* Video/Thumbnail */}
          <div className="flex-1 relative flex items-center justify-center">
            <div className="w-full aspect-[9/16] max-h-full relative">
              {reel?.thumbnailUrl ? (
                <img
                  src={reel.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : reel?.mediaUrl ? (
                <video
                  src={reel.mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                  <span className="text-dark-500">No preview</span>
                </div>
              )}

              {/* Play button overlay */}
              <button
                onClick={onPlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </button>

              {/* Duration badge */}
              {reel?.metadata?.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  {formatDuration(reel.metadata.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail change button */}
          <button
            onClick={onChangeThumbnail}
            className="m-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Image className="w-4 h-4" />
            Change Thumbnail
          </button>
        </div>

        {/* Right side - Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <h3 className="text-lg font-medium text-dark-100">Edit Reel</h3>
            <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Caption */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <span>Caption</span>
                <span className={`text-xs ${caption.length > CAPTION_LIMIT ? 'text-red-400' : 'text-dark-500'}`}>
                  {caption.length}/{CAPTION_LIMIT}
                </span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={4}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Hashtags */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <Hash className="w-4 h-4" />
                <span>Hashtags</span>
                <span className={`text-xs ${hashtagCount > HASHTAG_LIMIT ? 'text-red-400' : 'text-dark-500'}`}>
                  {hashtagCount}/{HASHTAG_LIMIT}
                </span>
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#viral #reels #trending"
                rows={2}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple resize-none"
              />
              <p className="text-xs text-dark-500 mt-1">Separate with spaces. # will be added automatically.</p>
            </div>

            {/* Audio/Song */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <Music className="w-4 h-4" />
                <span>Audio Track</span>
              </label>
              <input
                type="text"
                value={audioTrack}
                onChange={(e) => setAudioTrack(e.target.value)}
                placeholder="Original audio or song name"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
              <p className="text-xs text-dark-500 mt-1">Add a trending song to boost reach</p>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
            </div>

            {/* Mentions */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <AtSign className="w-4 h-4" />
                <span>Mentions</span>
              </label>
              <input
                type="text"
                value={mentions}
                onChange={(e) => setMentions(e.target.value)}
                placeholder="@username @another"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-purple"
              />
              <p className="text-xs text-dark-500 mt-1">Separate with spaces. @ will be added automatically.</p>
            </div>

            {/* Schedule */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                <Clock className="w-4 h-4" />
                <span>Schedule</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 focus:outline-none focus:border-accent-purple"
              />
              <p className="text-xs text-dark-500 mt-1">Leave empty to save as draft</p>
            </div>

            {/* Metadata info */}
            {reel?.metadata && (
              <div className="mb-4 p-3 bg-dark-700/50 rounded-lg">
                <p className="text-xs text-dark-500 mb-2 font-medium">Video Info</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {reel.metadata.width && reel.metadata.height && (
                    <div>
                      <span className="text-dark-500">Resolution:</span>
                      <span className="text-dark-300 ml-1">{reel.metadata.width}x{reel.metadata.height}</span>
                    </div>
                  )}
                  {reel.metadata.duration && (
                    <div>
                      <span className="text-dark-500">Duration:</span>
                      <span className="text-dark-300 ml-1">{formatDuration(reel.metadata.duration)}</span>
                    </div>
                  )}
                  {reel.metadata.fileSize && (
                    <div>
                      <span className="text-dark-500">Size:</span>
                      <span className="text-dark-300 ml-1">{(reel.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 border-t border-dark-700">
            {/* Delete button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-dark-600 disabled:text-dark-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
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
