import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Play, Image, Film } from 'lucide-react';

function GridItem({ post, isSelected, isLocked, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: post.id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVideo = post.mediaType === 'video';
  const isCarousel = post.mediaType === 'carousel';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isLocked ? { ...attributes, ...listeners } : {})}
      className={`relative aspect-square bg-dark-700 rounded-lg overflow-hidden transition-all duration-200 group ${
        isSelected
          ? 'ring-2 ring-accent-purple ring-offset-2 ring-offset-dark-800'
          : 'hover:ring-2 hover:ring-dark-500'
      } ${isDragging ? 'z-10 cursor-grabbing' : isLocked ? 'cursor-pointer' : 'cursor-grab'}`}
      onClick={onClick}
    >
      {/* Image or Placeholder */}
      {post.image ? (
        <img
          src={post.image}
          alt={post.caption || 'Grid post'}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: post.color || '#3f3f46' }}
        >
          <Image className="w-8 h-8 text-white/50" />
        </div>
      )}

      {/* Media Type Indicator */}
      {(isVideo || isCarousel) && (
        <div className="absolute top-2 right-2">
          {isVideo && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {isCarousel && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <Film className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 pointer-events-none">
        {/* Drag hint */}
        {!isLocked && (
          <div className="p-2 bg-dark-800/80 rounded-lg text-dark-200">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-2 bg-dark-800/80 rounded-lg text-dark-200 hover:text-red-400 transition-colors pointer-events-auto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Position Number */}
      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white/80 font-medium">
        {post.gridPosition + 1}
      </div>

      {/* Status Indicator */}
      {post.status && (
        <div className="absolute top-2 left-2">
          <span
            className={`badge ${
              post.status === 'scheduled'
                ? 'badge-blue'
                : post.status === 'published'
                ? 'badge-green'
                : post.status === 'draft'
                ? 'badge-orange'
                : ''
            }`}
          >
            {post.status}
          </span>
        </div>
      )}
    </div>
  );
}

export default GridItem;
