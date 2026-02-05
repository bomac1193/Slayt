import {
  Check,
  Edit,
  Trash2,
  Film,
  Image,
  Youtube,
} from 'lucide-react';

function GalleryMediaCard({
  item,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  viewMode,
  readOnly,
  isYouTube,
}) {
  const imageUrl = item.mediaUrl || item.thumbnailUrl || null;

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-4 p-3 bg-dark-800 rounded-lg transition-all ${
          readOnly ? 'cursor-default' : 'cursor-pointer'
        } ${
          isSelected
            ? 'ring-2 ring-zinc-400'
            : readOnly
              ? ''
              : 'hover:bg-dark-700'
        }`}
        onClick={() => !readOnly && onToggleSelect?.(item._id)}
      >
        {/* Selection Checkbox */}
        {!readOnly && (
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              isSelected
                ? 'bg-zinc-200 border-zinc-200'
                : 'border-dark-500'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-dark-900" />}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-16 h-16 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-600">
              <Image className="w-6 h-6 text-dark-400" />
            </div>
          )}
          {isYouTube && (
            <div className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded bg-red-600 flex items-center justify-center">
              <Youtube className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-dark-200 truncate">
            {item.title || item.caption || 'Untitled'}
          </p>
          <p className="text-sm text-dark-500">
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : 'Unknown date'}
          </p>
        </div>

        {/* Badges + Actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-dark-400">
            {item.mediaType || 'image'}
          </span>
          {!readOnly && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(item._id);
              }}
              className="btn-icon text-dark-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className={`group relative aspect-square bg-dark-700 rounded-xl overflow-hidden transition-all ${
        readOnly ? 'cursor-default' : 'cursor-pointer'
      } ${
        isSelected
          ? 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-dark-900'
          : readOnly
            ? ''
            : 'hover:ring-2 hover:ring-dark-500'
      }`}
      onClick={() => !readOnly && onToggleSelect?.(item._id)}
    >
      {/* Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={item.title || ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div
        className={`w-full h-full flex flex-col items-center justify-center ${imageUrl ? 'hidden' : ''}`}
        style={{ backgroundColor: '#3f3f46' }}
      >
        <Image className="w-8 h-8 text-white/30 mb-2" />
        <span className="text-xs text-white/50 px-2 text-center truncate max-w-full">
          {item.title || 'Untitled'}
        </span>
      </div>

      {/* Selection Indicator */}
      {!readOnly && (
        <div
          className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-zinc-200 border-zinc-200'
              : 'border-white/50 bg-black/30 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 text-dark-900" />}
        </div>
      )}

      {/* Type Badge */}
      {item.mediaType === 'video' && !isYouTube && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
          <Film className="w-3 h-3 text-white" />
        </div>
      )}

      {/* YouTube Badge */}
      {isYouTube && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded bg-red-600 flex items-center justify-center">
          <Youtube className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs text-white truncate">
          {item.title || item.caption || 'Untitled'}
        </p>
      </div>

      {/* Hover Actions */}
      {!readOnly && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(item);
            }}
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(item._id);
            }}
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-red-500/50"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

export default GalleryMediaCard;
