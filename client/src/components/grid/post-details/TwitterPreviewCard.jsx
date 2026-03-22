import React from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
} from 'lucide-react';
import PlatformCaptionEditor from './PlatformCaptionEditor';

const TwitterPreviewCard = React.memo(function TwitterPreviewCard({
  croppedSrc,
  cropStyles,
  caption,
  isCustomCaption,
  onUpdateCaption,
  onPersistCaption,
  onClearCustomCaption,
  displayName,
  username,
  userAvatar,
}) {
  return (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-sm">{displayName}</span>
              <span className="text-gray-500 text-sm">@{username}</span>
              <span className="text-gray-500 text-sm">· 2h</span>
            </div>

            {/* Tweet Text */}
            <PlatformCaptionEditor
              platform="twitter"
              caption={caption}
              isCustom={isCustomCaption}
              onUpdate={onUpdateCaption}
              onPersist={onPersistCaption}
              onClearCustom={onClearCustomCaption}
            />

            {/* Image */}
            {croppedSrc && (
              <div
                className="mt-3 rounded-2xl border border-gray-800 bg-gray-900 w-full overflow-hidden"
                style={{ aspectRatio: '16/9', ...cropStyles.containerStyle }}
              >
                <img
                  src={croppedSrc}
                  alt=""
                  className="select-none"
                  style={cropStyles.imageStyle}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 max-w-md">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <Share2 className="w-4 h-4 text-gray-500" />
              <Heart className="w-4 h-4 text-gray-500" />
              <Bookmark className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
});

export default TwitterPreviewCard;
