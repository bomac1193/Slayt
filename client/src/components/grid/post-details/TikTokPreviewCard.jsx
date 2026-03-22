import React from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  Music,
} from 'lucide-react';
import PlatformCaptionEditor from './PlatformCaptionEditor';

const TikTokPreviewCard = React.memo(function TikTokPreviewCard({
  croppedSrc,
  cropStyles,
  caption,
  hashtags,
  isCustomCaption,
  onUpdateCaption,
  onPersistCaption,
  onClearCustomCaption,
  displayName,
  userAvatar,
  postColor,
}) {
  return (
    <div className="tiktok-native bg-black rounded-xl overflow-hidden relative" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
      {/* Background Image/Video */}
      <div className="absolute inset-0 overflow-hidden">
        {croppedSrc ? (
          <img
            src={croppedSrc}
            alt=""
            className="w-full h-full select-none"
            style={cropStyles.imageStyle}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: postColor || '#1f1f1f' }}>
            <Play className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Right Actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="w-5 h-5 rounded-full bg-dark-100 -mt-2 flex items-center justify-center">
            <span className="text-white text-xs">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Heart className="w-8 h-8 text-white" fill="white" />
        </div>

        <div className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>

        <div className="flex flex-col items-center">
          <Bookmark className="w-8 h-8 text-white" />
        </div>

        <div className="flex flex-col items-center">
          <Share2 className="w-8 h-8 text-white" />
        </div>

        <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-3 right-16 z-10">
        <p className="text-white font-semibold text-sm mb-1">{displayName}</p>
        <PlatformCaptionEditor
          platform="tiktok"
          caption={caption}
          isCustom={isCustomCaption}
          onUpdate={onUpdateCaption}
          onPersist={onPersistCaption}
          onClearCustom={onClearCustomCaption}
        />
        <div className="flex items-center gap-2 mt-2">
          <Music className="w-4 h-4 text-white" />
          <p className="text-white text-xs">Original Sound - {displayName}</p>
        </div>
      </div>

      {/* Preview label */}
      <div className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded">
        <span className="text-white text-xs">Preview</span>
      </div>
    </div>
  );
});

export default TikTokPreviewCard;
