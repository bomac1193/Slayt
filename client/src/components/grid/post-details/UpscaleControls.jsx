import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  Loader2,
  Crop,
  ZoomIn,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { aiApi, contentApi } from '../../../lib/api';
import { useAppStore } from '../../../stores/useAppStore';
import { resolvePrimaryImageSource } from './constants';
import CompareSlider from './CompareSlider';

const UpscaleControls = React.memo(function UpscaleControls({
  post,
  primaryImageSrc,
  originalImageSrc,
  isQuickEditing,
  cropEditor,
  onStartQuickEdit,
  getTransformedMediaStyle,
  onReplace,
}) {
  const updatePost = useAppStore((state) => state.updatePost);
  const replaceInputRef = useRef(null);

  const [replacing, setReplacing] = useState(false);
  const [upscaling, setUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState(() =>
    post?.originalImage && primaryImageSrc ? primaryImageSrc : null
  );
  const [showUpscaled, setShowUpscaled] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [upscaleError, setUpscaleError] = useState(null);

  // Reset upscale state when switching posts
  useEffect(() => {
    const hasUpscale = post?.originalImage && primaryImageSrc && primaryImageSrc !== post.originalImage;
    setUpscaledImage(hasUpscale ? primaryImageSrc : null);
    setShowUpscaled(true);
    setCompareMode(false);
    setUpscaleError(null);
  }, [post?.id, post?._id, post?.image, post?.originalImage, post?.images, post?.mediaUrl]);

  const handleUpscale = async (provider) => {
    const postId = post.id || post._id;
    setUpscaling(true);
    setUpscaleError(null);
    try {
      const result = await aiApi.upscaleImage(postId, provider);
      updatePost(postId, {
        image: result.mediaUrl,
        originalImage: result.originalMediaUrl,
      });
      setUpscaledImage(result.mediaUrl);
      setShowUpscaled(true);
    } catch (error) {
      console.error('Upscale failed:', error);
      const msg = error?.response?.data?.error || error.message || 'Upscale failed';
      setUpscaleError(msg);
    } finally {
      setUpscaling(false);
    }
  };

  const handleReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const postId = post.id || post._id;
    setReplacing(true);
    try {
      const result = await contentApi.updateMedia(postId, file);
      const updated = result.content || result;
      const newUrl = updated.mediaUrl;
      // Update local post immediately so both the preview and grid cell refresh
      updatePost(postId, {
        image: newUrl,
        images: [newUrl],
        mediaUrl: newUrl,
        thumbnailUrl: updated.thumbnailUrl,
        originalImage: updated.originalMediaUrl || newUrl,
        originalMediaUrl: updated.originalMediaUrl || newUrl,
        metadata: updated.metadata,
        editSettings: null,
      });
      // Also refresh the grid to update the grid cells
      if (onReplace) await onReplace();
    } catch (err) {
      console.error('Replace failed:', err);
      setUpscaleError('Replace failed');
    } finally {
      setReplacing(false);
    }
  };

  const mediaStyle = getTransformedMediaStyle();

  return (
    <>
      <div className={`bg-dark-700 relative flex-shrink-0 ${isQuickEditing ? 'aspect-auto' : 'aspect-square'}`}>
        {isQuickEditing ? (
          cropEditor
        ) : (
          <>
            {primaryImageSrc ? (
              compareMode && upscaledImage ? (
                <CompareSlider
                  originalSrc={originalImageSrc}
                  upscaledSrc={upscaledImage}
                  mediaStyle={mediaStyle}
                />
              ) : (
                <img
                  src={showUpscaled && upscaledImage ? upscaledImage : originalImageSrc}
                  alt={post.caption || 'Post preview'}
                  className="w-full h-full"
                  style={mediaStyle}
                />
              )
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: post.color || '#3f3f46' }}
              >
                <Image className="w-16 h-16 text-white/30" />
              </div>
            )}

            {/* Edit Overlay */}
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleReplace}
              className="hidden"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex flex-col gap-2">
                {(upscaling || replacing) ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-white font-medium">{replacing ? 'Replacing...' : 'Upscaling...'}</span>
                  </div>
                ) : (
                  <>
                    {upscaleError && (
                      <div className="px-3 py-1.5 bg-dark-700 backdrop-blur-sm">
                        <span className="text-white text-xs">{upscaleError}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-2 bg-white/20 backdrop-blur-sm">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={() => handleUpscale('replicate')}
                        title="Upscale with Replicate (Best quality)"
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                      >
                        <span className="text-white font-bold text-sm">R</span>
                        <span className="text-white/70 text-xs">Best</span>
                      </button>
                      <button
                        onClick={() => handleUpscale('cloudinary')}
                        title="Upscale with Cloudinary (Fast)"
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                      >
                        <span className="text-white font-bold text-sm">C</span>
                        <span className="text-white/70 text-xs">Fast</span>
                      </button>
                    </div>
                  </>
                )}
                <button
                  onClick={onStartQuickEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Crop className="w-4 h-4 text-white" />
                  <span className="text-white font-medium">Quick Edit</span>
                </button>
                <button
                  onClick={() => replaceInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                  <span className="text-white font-medium">Replace</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Version Toggle Bar */}
      {upscaledImage && !isQuickEditing && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800">
          <button
            onClick={() => { setShowUpscaled(false); setCompareMode(false); }}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              !showUpscaled && !compareMode
                ? 'bg-white text-dark-900'
                : 'text-dark-300 hover:text-white hover:bg-dark-700'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => { setShowUpscaled(true); setCompareMode(false); }}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              showUpscaled && !compareMode
                ? 'bg-white text-dark-900'
                : 'text-dark-300 hover:text-white hover:bg-dark-700'
            }`}
          >
            Upscaled
          </button>
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={`ml-auto p-1 rounded transition-colors ${
              compareMode
                ? 'bg-white text-dark-900'
                : 'text-dark-300 hover:text-white hover:bg-dark-700'
            }`}
            title="Compare"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
});

export default UpscaleControls;
