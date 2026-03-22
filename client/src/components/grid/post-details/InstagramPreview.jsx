import React from 'react';
import {
  Image,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  MoreHorizontal,
} from 'lucide-react';
import PlatformCaptionEditor from './PlatformCaptionEditor';

const InstagramPreview = React.memo(function InstagramPreview({
  croppedSrc,
  cropStyles,
  caption,
  isCustomCaption,
  onUpdateCaption,
  onPersistCaption,
  onClearCustomCaption,
  displayName,
  userAvatar,
  postColor,
  isEditing,
  saving,
  onSave,
}) {
  return (
    <div className="instagram-native bg-black rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{displayName}</p>
            <p className="text-gray-400 text-xs">Original</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-white" />
      </div>

      {/* Image */}
      <div className="aspect-square bg-black" style={cropStyles.containerStyle}>
        {croppedSrc ? (
          <img
            src={croppedSrc}
            alt=""
            className="select-none"
            style={cropStyles.imageStyle}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: postColor || '#1f1f1f' }}>
            <Image className="w-12 h-12 text-gray-600" />
          </div>
        )}
      </div>

      {/* Save bar */}
      {isEditing && (
        <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
          <span className="text-gray-400 text-xs">Drag crop edges to resize · Drag inside to move</span>
          <button
            onClick={onSave}
            disabled={saving}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-5 h-5 text-white" fill="none" />
            <MessageCircle className="w-5 h-5 text-white" />
            <Send className="w-5 h-5 text-white" />
          </div>
          <Bookmark className="w-5 h-5 text-white" />
        </div>

        {/* Caption */}
        <p className="text-white text-sm font-semibold">{displayName}</p>
        <PlatformCaptionEditor
          platform="instagram"
          caption={caption}
          isCustom={isCustomCaption}
          onUpdate={onUpdateCaption}
          onPersist={onPersistCaption}
          onClearCustom={onClearCustomCaption}
        />

        <p className="text-gray-500 text-xs mt-2">Preview</p>
      </div>
    </div>
  );
});

export default InstagramPreview;
