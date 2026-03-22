import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { contentApi } from '../../../lib/api';

export function usePostPersistence(post) {
  const updatePost = useAppStore((state) => state.updatePost);
  const postId = post?.id || post?._id || null;
  const initialCaption = post?.caption || '';
  const initialHashtags = Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : '';
  const initialPlatformCaptions = post?.editSettings?.platformCaptions || {};

  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [platformCaptions, setPlatformCaptions] = useState(initialPlatformCaptions);

  const captionDraftRef = useRef(caption);
  const hashtagsDraftRef = useRef(hashtags);
  const lastPostIdRef = useRef(postId);

  const parseHashtagsText = useCallback((value) => (
    String(value || '')
      .split(/[\s,#]+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
  ), []);

  const persistPost = useCallback(async (payload, targetId = postId) => {
    if (!targetId) return;
    updatePost(targetId, payload);
    try {
      await contentApi.update(targetId, payload);
    } catch (err) {
      console.error('Failed to persist post update:', err);
    }
  }, [postId, updatePost]);

  useEffect(() => {
    captionDraftRef.current = caption;
  }, [caption]);

  useEffect(() => {
    hashtagsDraftRef.current = hashtags;
  }, [hashtags]);

  // Get caption for a specific platform (falls back to general)
  const getCaptionForPlatform = useCallback((platform) => {
    return platformCaptions[platform] ?? caption;
  }, [platformCaptions, caption]);

  // Update caption — either general or platform-specific
  const updatePlatformCaption = useCallback(async (platform, value, isCustom) => {
    if (isCustom) {
      // Platform-specific override
      const next = { ...platformCaptions, [platform]: value };
      setPlatformCaptions(next);
    } else {
      // Update general caption (applies to all without overrides)
      setCaption(value);
      captionDraftRef.current = value;
    }
  }, [platformCaptions]);

  // Persist platform caption on blur
  const persistPlatformCaption = useCallback(async (platform, value, isCustom) => {
    if (!postId) return;
    if (isCustom) {
      const next = { ...platformCaptions, [platform]: value };
      setPlatformCaptions(next);
      const payload = { editSettings: { ...(post?.editSettings || {}), platformCaptions: next } };
      updatePost(postId, payload);
      try { await contentApi.update(postId, payload); } catch (err) { console.error('Failed to persist platform caption:', err); }
    } else {
      setCaption(value);
      captionDraftRef.current = value;
      persistPost({ caption: value });
    }
  }, [postId, platformCaptions, post?.editSettings, updatePost, persistPost]);

  // Clear platform override (revert to general)
  const clearPlatformCaption = useCallback(async (platform) => {
    const next = { ...platformCaptions };
    delete next[platform];
    setPlatformCaptions(next);
    if (!postId) return;
    const payload = { editSettings: { ...(post?.editSettings || {}), platformCaptions: next } };
    updatePost(postId, payload);
    try { await contentApi.update(postId, payload); } catch (err) { console.error('Failed to clear platform caption:', err); }
  }, [postId, platformCaptions, post?.editSettings, updatePost]);

  // Persist drafts when switching posts (only trigger on postId change)
  useEffect(() => {
    const prevId = lastPostIdRef.current;
    if (prevId && prevId !== postId) {
      const prevCaption = captionDraftRef.current;
      const prevHashtags = hashtagsDraftRef.current;
      updatePost(prevId, {
        caption: prevCaption,
        hashtags: parseHashtagsText(prevHashtags),
      });
      contentApi.update(prevId, {
        caption: prevCaption,
        hashtags: parseHashtagsText(prevHashtags),
      }).catch(err => console.error('Failed to persist post update:', err));
    }

    lastPostIdRef.current = postId;
    const cap = post?.caption || '';
    const tags = Array.isArray(post?.hashtags) ? post.hashtags.join(' ') : '';
    const platCaps = post?.editSettings?.platformCaptions || {};
    setCaption(cap);
    setHashtags(tags);
    setPlatformCaptions(platCaps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleCaptionBlur = useCallback(() => {
    persistPost({ caption });
  }, [caption, persistPost]);

  const handleHashtagsBlur = useCallback(() => {
    persistPost({ hashtags: parseHashtagsText(hashtags) });
  }, [hashtags, persistPost, parseHashtagsText]);

  return {
    caption,
    setCaption,
    hashtags,
    setHashtags,
    handleCaptionBlur,
    handleHashtagsBlur,
    persistPost,
    parseHashtagsText,
    platformCaptions,
    getCaptionForPlatform,
    updatePlatformCaption,
    persistPlatformCaption,
    clearPlatformCaption,
  };
}
