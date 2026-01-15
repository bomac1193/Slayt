import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useNavigate } from 'react-router-dom';
import {
  Image,
  Type,
  Hash,
  Clock,
  Sparkles,
  Send,
  Calendar,
  Edit3,
  Wand2,
} from 'lucide-react';

function PostDetails({ post }) {
  const navigate = useNavigate();
  const updatePost = useAppStore((state) => state.updatePost);
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '');

  if (!post) {
    return (
      <div className="h-full bg-dark-800 rounded-2xl border border-dark-700 p-6 flex flex-col items-center justify-center text-center">
        <Image className="w-12 h-12 text-dark-500 mb-4" />
        <p className="text-dark-300 mb-2">No post selected</p>
        <p className="text-sm text-dark-500">
          Click on a grid item to view and edit its details
        </p>
      </div>
    );
  }

  const handleCaptionChange = (value) => {
    setCaption(value);
    updatePost(post.id, { caption: value });
  };

  const handleHashtagsChange = (value) => {
    setHashtags(value);
    const tags = value
      .split(/[\s,#]+/)
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
    updatePost(post.id, { hashtags: tags });
  };

  return (
    <div className="h-full bg-dark-800 rounded-2xl border border-dark-700 flex flex-col overflow-hidden">
      {/* Preview Image */}
      <div className="aspect-square bg-dark-700 relative flex-shrink-0">
        {post.image ? (
          <img
            src={post.image}
            alt={post.caption || 'Post preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: post.color || '#3f3f46' }}
          >
            <Image className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* Edit Overlay */}
        <button
          onClick={() => navigate('/editor', { state: { postId: post.id } })}
          className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Edit3 className="w-4 h-4 text-white" />
            <span className="text-white font-medium">Edit Image</span>
          </div>
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Caption */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Type className="w-4 h-4" />
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Write a caption..."
            className="input min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {caption.length}/2200 characters
            </span>
            <button className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Generate with AI
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
            onChange={(e) => handleHashtagsChange(e.target.value)}
            placeholder="#fashion #style #ootd"
            className="input min-h-[60px] resize-none text-accent-blue"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {post.hashtags?.length || 0}/30 hashtags
            </span>
            <button className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggest hashtags
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => navigate('/editor', { state: { postId: post.id } })}
            className="w-full btn-secondary justify-start"
          >
            <Wand2 className="w-4 h-4" />
            Open in Editor
          </button>

          <button className="w-full btn-secondary justify-start">
            <Calendar className="w-4 h-4" />
            Schedule Post
          </button>

          <button className="w-full btn-secondary justify-start">
            <Clock className="w-4 h-4" />
            Best Time to Post
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-dark-700 flex gap-2">
        <button className="flex-1 btn-secondary">
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
        <button className="flex-1 btn-primary">
          <Send className="w-4 h-4" />
          Post Now
        </button>
      </div>
    </div>
  );
}

export default PostDetails;
