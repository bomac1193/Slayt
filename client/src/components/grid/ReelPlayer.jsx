import { useState, useRef, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatDuration } from '../../utils/videoUtils';

/**
 * Instagram-like Reel player modal
 * Shows video with Instagram UI overlay (like, comment, share, etc.)
 */
function ReelPlayer({ reel, onClose, onSelectThumbnail }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const user = useAppStore((state) => state.user);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Auto-play on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, show play button
        setIsPlaying(false);
      });
    }

    // Hide controls after 3 seconds
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle video metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  // Handle video end - loop
  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Toggle play/pause
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

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    // Hide after 3 seconds of no movement
    clearTimeout(window.controlsTimer);
    window.controlsTimer = setTimeout(() => setShowControls(false), 3000);
  };

  // Double tap to like
  const [lastTap, setLastTap] = useState(0);
  const handleVideoClick = (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - like
      setIsLiked(true);
      // Show heart animation
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.className = 'absolute text-6xl animate-ping pointer-events-none';
      heart.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left - 30}px`;
      heart.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top - 30}px`;
      e.currentTarget.appendChild(heart);
      setTimeout(() => heart.remove(), 500);
    } else {
      // Single tap - toggle play
      togglePlay();
    }
    setLastTap(now);
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onClick={onClose}
      onMouseMove={handleMouseMove}
    >
      <div
        className="relative h-full max-h-[100vh] aspect-[9/16] bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={reel.mediaUrl}
          className="w-full h-full object-contain cursor-pointer"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={handleVideoClick}
          playsInline
          loop
        />

        {/* Play/Pause indicator (shows briefly on toggle) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="absolute top-0 left-0 right-0 h-1 bg-white/30 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top controls */}
        <div className={`absolute top-4 left-4 right-4 flex items-center justify-between transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Right side actions (Instagram style) */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
          {/* Like */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex flex-col items-center gap-1"
          >
            <Heart className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            <span className="text-white text-xs">1.2K</span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-1">
            <MessageCircle className="w-7 h-7 text-white" />
            <span className="text-white text-xs">128</span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-1">
            <Send className="w-7 h-7 text-white" />
            <span className="text-white text-xs">Share</span>
          </button>

          {/* Save */}
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="flex flex-col items-center gap-1"
          >
            <Bookmark className={`w-7 h-7 ${isSaved ? 'text-white fill-white' : 'text-white'}`} />
          </button>

          {/* More */}
          <button className="flex flex-col items-center gap-1">
            <MoreHorizontal className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-4 left-4 right-16">
          {/* User info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-dark-600" />
              )}
            </div>
            <span className="text-white font-semibold text-sm">
              {user?.brandName || user?.name || 'your_username'}
            </span>
            <button className="px-3 py-1 border border-white/50 rounded-md text-white text-xs hover:bg-white/10 transition-colors">
              Follow
            </button>
          </div>

          {/* Caption */}
          {reel.title && (
            <p className="text-white text-sm mb-2">{reel.title}</p>
          )}

          {/* Music info */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-sm" />
            <span className="text-white text-xs">Original audio</span>
          </div>
        </div>

        {/* Time display */}
        <div className={`absolute bottom-4 right-4 text-white text-xs transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>

        {/* Edit thumbnail button */}
        {onSelectThumbnail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectThumbnail();
            }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm hover:bg-black/70 transition-all ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            Change Thumbnail
          </button>
        )}
      </div>
    </div>
  );
}

export default ReelPlayer;
