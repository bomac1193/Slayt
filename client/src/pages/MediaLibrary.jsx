import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { contentApi } from '../lib/api';
import {
  Upload,
  Search,
  Grid,
  List,
  Filter,
  Image,
  Film,
  FolderOpen,
  MoreVertical,
  Trash2,
  Edit,
  Download,
  Plus,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function MediaLibrary() {
  const navigate = useNavigate();
  const addToGrid = useAppStore((state) => state.addToGrid);
  const selectPost = useAppStore((state) => state.selectPost);

  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState('all');

  // Fetch content from backend
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contentApi.getAll();
      // Handle both array and object response
      const items = Array.isArray(data) ? data : data.content || data.contents || [];
      setContent(items);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const filteredContent = content.filter((item) => {
    const title = item.title || item.caption || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'images' && item.mediaType !== 'video') ||
      (filterType === 'videos' && item.mediaType === 'video');
    return matchesSearch && matchesType;
  });

  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      try {
        await contentApi.upload(file, {
          title: file.name,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    // Refresh content list
    fetchContent();
  }, [fetchContent]);

  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddToGrid = () => {
    selectedItems.forEach((id) => {
      const item = content.find((c) => c._id === id);
      if (item) {
        addToGrid({
          id: item._id,
          image: item.mediaUrl,
          caption: item.caption || item.title,
          mediaType: item.mediaType,
          color: '#8b5cf6',
        });
      }
    });
    setSelectedItems([]);
  };

  const handleDelete = async (id) => {
    try {
      await contentApi.delete(id);
      setContent((prev) => prev.filter((c) => c._id !== id));
      setSelectedItems((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedItems) {
      await handleDelete(id);
    }
  };

  // Get image URL (handle relative paths)
  const getImageUrl = (item) => {
    if (!item.mediaUrl) return null;
    if (item.mediaUrl.startsWith('http')) return item.mediaUrl;
    return item.mediaUrl; // Will be proxied through Vite
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="w-80 pl-10 pr-4 py-2 input"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 p-1 bg-dark-800 rounded-lg">
            {[
              { id: 'all', label: 'All' },
              { id: 'images', label: 'Images', icon: Image },
              { id: 'videos', label: 'Videos', icon: Film },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  filterType === filter.id
                    ? 'bg-accent-purple text-white'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {filter.icon && <filter.icon className="w-4 h-4" />}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={fetchContent} className="btn-icon" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-dark-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-accent-purple text-white'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-accent-purple text-white'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload */}
          <label className="btn-primary cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
          {error}
          <button onClick={fetchContent} className="ml-4 underline">
            Retry
          </button>
        </div>
      )}

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <span className="text-sm text-dark-200">
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToGrid}
              className="btn-secondary text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add to Grid
            </button>
            <button
              onClick={handleDeleteSelected}
              className="btn-danger text-sm py-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedItems([])}
            className="ml-auto text-sm text-dark-400 hover:text-dark-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Media Grid */}
      <div className="flex-1 overflow-auto">
        {filteredContent.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <FolderOpen className="w-16 h-16 text-dark-500 mb-4" />
            <p className="text-dark-300 mb-2">No media found</p>
            <p className="text-sm text-dark-500 mb-4">
              {content.length > 0
                ? 'Try adjusting your search or filter'
                : 'Upload images or videos to get started'}
            </p>
            <label className="btn-primary cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Media
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredContent.map((item) => {
              const isSelected = selectedItems.includes(item._id);
              const imageUrl = getImageUrl(item);

              return (
                <div
                  key={item._id}
                  className={`group relative aspect-square bg-dark-700 rounded-xl overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-accent-purple ring-offset-2 ring-offset-dark-900'
                      : 'hover:ring-2 hover:ring-dark-500'
                  }`}
                  onClick={() => toggleSelection(item._id)}
                >
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
                  <div
                    className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-accent-purple border-accent-purple'
                        : 'border-white/50 bg-black/30 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Type Badge */}
                  {item.mediaType === 'video' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <Film className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white truncate">
                      {item.title || 'Untitled'}
                    </p>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectPost(item._id);
                        navigate('/editor', { state: { contentId: item._id, imageUrl } });
                      }}
                      className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                      }}
                      className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-red-500/50"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContent.map((item) => {
              const isSelected = selectedItems.includes(item._id);
              const imageUrl = getImageUrl(item);

              return (
                <div
                  key={item._id}
                  className={`flex items-center gap-4 p-3 bg-dark-800 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-accent-purple'
                      : 'hover:bg-dark-700'
                  }`}
                  onClick={() => toggleSelection(item._id)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-accent-purple border-accent-purple'
                        : 'border-dark-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="w-16 h-16 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
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
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-dark-200 truncate">
                      {item.title || 'Untitled'}
                    </p>
                    <p className="text-sm text-dark-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : 'Unknown date'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge badge-purple">
                      {item.mediaType || 'image'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                      }}
                      className="btn-icon text-dark-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm text-dark-400">
        <span>{filteredContent.length} items</span>
        <span>{content.filter((c) => c.mediaType === 'video').length} videos</span>
        <span>{content.filter((c) => c.mediaType !== 'video').length} images</span>
        <span className="ml-auto text-dark-500">
          Data from MongoDB
        </span>
      </div>
    </div>
  );
}

export default MediaLibrary;
