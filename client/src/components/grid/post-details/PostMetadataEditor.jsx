import React, { useState, useEffect } from 'react';
import {
  Type,
  Hash,
  Sparkles,
  Calendar,
  Clock,
  Loader2,
  Dice5,
} from 'lucide-react';
import { useAppStore } from '../../../stores/useAppStore';
import { aiApi, intelligenceApi } from '../../../lib/api';

const PostMetadataEditor = React.memo(function PostMetadataEditor({
  postId,
  caption,
  hashtags,
  onCaptionChange,
  onCaptionBlur,
  onHashtagsChange,
  onHashtagsBlur,
  onOpenScheduleModal,
  onOpenBestTimeModal,
  persistPost,
}) {
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const activeFolioId = useAppStore((state) => state.activeFolioId);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const hashtagCount = hashtags ? hashtags.split(/\s+/).filter(Boolean).length : 0;
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingHashtags, setGeneratingHashtags] = useState(false);
  const [tasteProfile, setTasteProfile] = useState(null);

  // Load taste profile once for dice rolls
  useEffect(() => {
    const loadTaste = async () => {
      try {
        const res = await intelligenceApi.getProfile(currentProfileId || null);
        if (res?.tasteProfile) setTasteProfile(res.tasteProfile);
      } catch (err) {
        console.error('Failed to load taste profile for grid dice:', err);
      }
    };
    loadTaste();
  }, [currentProfileId]);

  const cleanGeneratedText = (text) => {
    const cleaned = String(text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    if (!cleaned) return '';
    if (/^json$/i.test(cleaned)) return '';
    return cleaned;
  };

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const captions = await aiApi.generateCaptionForContent(postId, {
        tone: 'casual',
        length: 'medium',
        profileId: currentProfileId || null,
      });
      if (captions && captions.length > 0) {
        const newCaption = cleanGeneratedText(captions[0]);
        onCaptionChange(newCaption);
        persistPost({ caption: newCaption });
      }
    } catch (error) {
      console.error('Failed to generate caption:', error);
      const fallbackCaptions = [
        "New post live. Tell me what detail landed most for you.",
        "Sharing this moment with you. What do you see first?",
        "Dropping this one for the people who notice the craft.",
        "Built this with intention. Let me know what resonates.",
        "Captured this in one take. Feedback welcome.",
        "A clean frame, a clear message, and no filler.",
        "Saved this one for the timeline. Thoughts?",
        "Here for quality over noise. Your take?",
      ];
      const newCaption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
      onCaptionChange(newCaption);
      persistPost({ caption: newCaption });
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleTasteRoll = async () => {
    setGeneratingCaption(true);
    try {
      const baseTopic = caption || 'taste-aligned social post';
      const glyph = tasteProfile?.glyph ? `Glyph ${tasteProfile.glyph}` : null;
      const tones = tasteProfile?.aestheticPatterns?.dominantTones?.slice(0, 3) || [];
      const hooks = tasteProfile?.performancePatterns?.hooks?.slice(0, 2) || [];
      const tags = hashtags ? hashtags.split(/\s+/).filter(Boolean).join(', ') : '';

      const topic = [
        baseTopic,
        glyph && `style: ${glyph}`,
        hooks.length ? `hooks: ${hooks.join(', ')}` : null,
        tones.length ? `tones: ${tones.join(', ')}` : null,
        tags && `hashtags: ${tags}`,
        'avoid generic intros; give 3 sharp, specific options; keep to 2 sentences max',
      ]
        .filter(Boolean)
        .join(' · ');

      const { variants = [] } = await intelligenceApi.generate(topic, {
        platform: 'instagram',
        count: 4,
        profileId: currentProfileId || undefined,
        folioId: activeFolioId || undefined,
        projectId: activeProjectId || undefined,
        tasteContext: tasteProfile ? {
          glyph: tasteProfile.glyph,
          tones: tasteProfile?.aestheticPatterns?.dominantTones,
          hooks: tasteProfile?.performancePatterns?.hooks,
          confidence: tasteProfile?.confidence,
        } : undefined,
        directives: [
          'No fluff, no generic "new post" language',
          'Lead with the hook, not context',
          'Stay within platform tone and glyph voice',
        ],
      });
      const pick = variants[0];
      if (pick) {
        const newCaption = cleanGeneratedText(pick.caption || pick.variant || pick.title || caption);
        onCaptionChange(newCaption);
        persistPost({ caption: newCaption });
      }
    } catch (error) {
      console.error('Taste-aligned generation failed:', error);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleSuggestHashtags = async () => {
    setGeneratingHashtags(true);
    try {
      const suggestedTags = await aiApi.generateHashtags(postId, 10);
      if (suggestedTags && suggestedTags.length > 0) {
        const newHashtags = suggestedTags.join(' ');
        onHashtagsChange(newHashtags);
        persistPost({ hashtags: suggestedTags });
      }
    } catch (error) {
      console.error('Failed to suggest hashtags:', error);
      const fallbackTags = ['#instagood', '#photooftheday', '#love', '#beautiful', '#happy', '#picoftheday', '#instadaily', '#amazing', '#style', '#lifestyle'];
      const selectedTags = fallbackTags.slice(0, 5 + Math.floor(Math.random() * 5));
      const newHashtags = selectedTags.join(' ');
      onHashtagsChange(newHashtags);
      persistPost({ hashtags: selectedTags });
    } finally {
      setGeneratingHashtags(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Caption */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200">
            <Type className="w-4 h-4" />
            Caption
          </label>
          <button
            onClick={handleTasteRoll}
            disabled={generatingCaption}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-dark-700 text-white hover:bg-dark-600 disabled:opacity-50"
            title="Taste-aligned roll for caption"
          >
            {generatingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dice5 className="w-3 h-3" />}
            <span>Dice</span>
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          onBlur={onCaptionBlur}
          placeholder="Write a caption..."
          className="input min-h-[100px] resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-dark-500">
            {caption.length}/2200 characters
          </span>
          <button
            onClick={handleGenerateCaption}
            disabled={generatingCaption}
            className="text-xs text-dark-100 hover:text-dark-100/80 flex items-center gap-1 disabled:opacity-50"
          >
            {generatingCaption ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Generate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hashtags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
          <Hash className="w-4 h-4" />
          Hashtags
        </label>
        <textarea
          value={hashtags}
          onChange={(e) => onHashtagsChange(e.target.value)}
          onBlur={onHashtagsBlur}
          placeholder="#fashion #style #ootd"
          className="input min-h-[60px] resize-none text-dark-100"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-dark-500">
            {hashtagCount}/30 hashtags
          </span>
          <button
            onClick={handleSuggestHashtags}
            disabled={generatingHashtags}
            className="text-xs text-dark-100 hover:text-dark-100/80 flex items-center gap-1 disabled:opacity-50"
          >
            {generatingHashtags ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Suggesting...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Suggest hashtags
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-2 space-y-2">
        <button onClick={onOpenScheduleModal} className="w-full btn-secondary justify-start">
          <Calendar className="w-4 h-4" />
          Schedule Post
        </button>

        <button onClick={onOpenBestTimeModal} className="w-full btn-secondary justify-start">
          <Clock className="w-4 h-4" />
          Best Time to Post
        </button>
      </div>
    </div>
  );
});

export default PostMetadataEditor;
