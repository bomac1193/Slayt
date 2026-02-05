import { ChevronDown, ChevronRight } from 'lucide-react';

function GallerySection({ title, icon: Icon, items, isCollapsed, onToggle, children, readOnly }) {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-2 px-1 group text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-dark-200 transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-dark-400 group-hover:text-dark-200 transition-colors" />
        )}
        {Icon && <Icon className="w-4 h-4 text-dark-300" />}
        <span className="text-sm font-medium text-dark-200">{title}</span>
        <span className="text-xs text-dark-500 bg-dark-800 px-2 py-0.5 rounded-full">
          {items.length} items
        </span>
        {readOnly && (
          <span className="text-xs text-dark-500 bg-dark-800/50 px-2 py-0.5 rounded-full">
            Read-only
          </span>
        )}
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default GallerySection;
