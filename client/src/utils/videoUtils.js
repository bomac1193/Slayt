/**
 * Generates a thumbnail from a video file
 * @param {File} videoFile - The video file to generate a thumbnail from
 * @returns {Promise<Object>} Object containing thumbnail blob, URL, and video metadata
 */
export const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration, whichever is smaller
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        resolve({
          thumbnailBlob: blob,
          thumbnailUrl: URL.createObjectURL(blob),
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
          isVertical: video.videoHeight > video.videoWidth
        });

        // Clean up the object URL for the video
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
