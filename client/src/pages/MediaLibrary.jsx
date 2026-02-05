import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { contentApi, gridApi, youtubeApi, reelCollectionApi } from '../lib/api';
import {
  Upload,
  Search,
  Grid,
  List,
  Image,
  Film,
  FolderOpen,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  LayoutGrid,
  Youtube,
  Palette,
} from 'lucide-react';
import GallerySection from '../components/gallery/GallerySection';
import GalleryMediaCard from '../components/gallery/GalleryMediaCard';
import GalleryColorView from '../components/gallery/GalleryColorView';

function MediaLibrary() {
  const navigate = useNavigate();
  const addToGrid = useAppStore((state) => state.addToGrid);
  const selectPost = useAppStore((state) => state.selectPost);

  // Data sources
  const [content, setContent] = useState([]);
  const [grids, setGrids] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [reelCollections, setReelCollections] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [colorSortMode, setColorSortMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Fetch all data sources in parallel
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contentRes, gridRes, ytRes, reelRes] = await Promise.allSettled([
        contentApi.getAll(),
        gridApi.getAll(),
        youtubeApi.getVideos(),
        reelCollectionApi.getAll(),
      ]);

      // Content
      if (contentRes.status === 'fulfilled') {
        const data = contentRes.value;
        setContent(Array.isArray(data) ? data : data.content || data.contents || []);
      } else {
        console.error('Failed to fetch content:', contentRes.reason);
      }

      // Grids
      if (gridRes.status === 'fulfilled') {
        const data = gridRes.value;
        setGrids(Array.isArray(data) ? data : data.grids || []);
      }

      // YouTube
      if (ytRes.status === 'fulfilled') {
        const data = ytRes.value;
        setYoutubeVideos(Array.isArray(data) ? data : data.videos || []);
      }

      // Reel Collections
      if (reelRes.status === 'fulfilled') {
        const data = reelRes.value;
        setReelCollections(Array.isArray(data) ? data : []);
      }

      // Show error only if content (primary source) failed
      if (contentRes.status === 'rejected') {
        setError(contentRes.reason?.message || 'Failed to load content');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Build set of content IDs in grids
  const gridContentIds = useMemo(() => {
    const ids = new Set();
    grids.forEach((grid) => {
      if (grid.cells) {
        grid.cells.forEach((cell) => {
          const cid = typeof cell.contentId === 'object' ? cell.contentId?._id : cell.contentId;
          if (cid) ids.add(cid);
        });
      }
      // Also check rows/columns format
      if (grid.rows) {
        grid.rows.forEach((row) => {
          row.forEach((cell) => {
            const cid = typeof cell.contentId === 'object' ? cell.contentId?._id : cell.contentId;
            if (cid) ids.add(cid);
          });
        });
      }
    });
    return ids;
  }, [grids]);

  // Build set of content IDs in reel collections
  const reelContentIds = useMemo(() => {
    const ids = new Set();
    reelCollections.forEach((col) => {
      if (col.reels) {
        col.reels.forEach((reel) => {
          const cid = typeof reel.contentId === 'object' ? reel.contentId?._id : reel.contentId;
          if (cid) ids.add(cid);
        });
      }
    });
    return ids;
  }, [reelCollections]);

  // Apply search + filter to content items
  const filterItem = useCallback(
    (item) => {
      const title = (item.title || item.caption || '').toLowerCase();
      if (searchQuery && !title.includes(searchQuery.toLowerCase())) return false;
      if (filterType === 'images' && item.mediaType === 'video') return false;
      if (filterType === 'videos' && item.mediaType !== 'video') return false;
      return true;
    },
    [searchQuery, filterType]
  );

  // Classify content into sections (priority order)
  const sections = useMemo(() => {
    const gridItems = [];
    const reelItems = [];
    const unsorted = [];

    content.forEach((item) => {
      if (!filterItem(item)) return;

      if (gridContentIds.has(item._id)) {
        gridItems.push(item);
      } else if (
        item.mediaType === 'video' &&
        (reelContentIds.has(item._id) || item.platform === 'instagram' || item.platform === 'tiktok')
      ) {
        reelItems.push(item);
      } else {
        unsorted.push(item);
      }
    });

    // YouTube items — filtered by search
    const ytItems = youtubeVideos
      .filter((v) => {
        if (!searchQuery) return true;
        const title = (v.title || '').toLowerCase();
        return title.includes(searchQuery.toLowerCase());
      })
      .map((v) => ({
        ...v,
        _id: v._id || v.id,
        mediaUrl: v.thumbnailUrl || v.thumbnail,
        thumbnailUrl: v.thumbnailUrl || v.thumbnail,
        _isYouTube: true,
      }));

    return {
      grid: gridItems,
      reels: reelItems,
      youtube: ytItems,
      unsorted,
    };
  }, [content, youtubeVideos, gridContentIds, reelContentIds, filterItem, searchQuery]);

  // All items flat (for color view)
  const allFilteredItems = useMemo(
    () => [...sections.grid, ...sections.reels, ...sections.youtube, ...sections.unsorted],
    [sections]
  );

  // Total counts
  const totalCount = allFilteredItems.length;

  // Toggle section collapse
  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Selection
  const toggleSelection = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Actions
  const handleAddToGrid = () => {
    selectedItems.forEach((id) => {
      const item = content.find((c) => c._id === id);
      if (item) {
        addToGrid({
          id: item._id,
          image: item.mediaUrl,
          caption: item.caption || item.title,
          mediaType: item.mediaType,
          color: '#d4d4d8',
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

  const handleEdit = (item) => {
    const imageUrl = item.mediaUrl || null;
    selectPost(item._id);
    navigate('/editor', { state: { contentId: item._id, imageUrl } });
  };

  const handleFileUpload = useCallback(
    async (e) => {
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
      fetchAll();
    },
    [fetchAll]
  );

  // Grid classes for card layout
  const gridCols =
    viewMode === 'grid'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
      : 'space-y-2';

  // Render a section's items
  const renderItems = (items, readOnly = false, isYouTube = false) => (
    <div className={gridCols}>
      {items.map((item) => (
        <GalleryMediaCard
          key={item._id}
          item={item}
          isSelected={selectedItems.includes(item._id)}
          onToggleSelect={toggleSelection}
          onEdit={handleEdit}
          onDelete={handleDelete}
          viewMode={viewMode}
          readOnly={readOnly}
          isYouTube={isYouTube}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
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

          {/* Filter Pills */}
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
                    ? 'bg-dark-600 text-dark-100'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {filter.icon && <filter.icon className="w-4 h-4" />}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Color Sort Toggle */}
          <button
            onClick={() => setColorSortMode((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              colorSortMode
                ? 'bg-dark-600 text-dark-100'
                : 'text-dark-400 hover:text-dark-200 bg-dark-800'
            }`}
            title="AI Color Sort"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button onClick={fetchAll} className="btn-icon" title="Refresh">
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
                  ? 'bg-dark-600 text-dark-100'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-dark-600 text-dark-100'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload */}
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer bg-zinc-200 text-dark-900 hover:bg-white transition-colors">
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
          <button onClick={fetchAll} className="ml-4 underline">
            Retry
          </button>
        </div>
      )}

      {/* Selection Bar */}
      {selectedItems.length > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
          <span className="text-sm text-dark-200">
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleAddToGrid} className="btn-secondary text-sm py-1.5">
              <Plus className="w-4 h-4" />
              Add to Grid
            </button>
            <button onClick={handleDeleteSelected} className="btn-danger text-sm py-1.5">
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {totalCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <FolderOpen className="w-16 h-16 text-dark-500 mb-4" />
            <p className="text-dark-300 mb-2">No media found</p>
            <p className="text-sm text-dark-500 mb-4">
              {content.length > 0
                ? 'Try adjusting your search or filter'
                : 'Upload images or videos to get started'}
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer bg-zinc-200 text-dark-900 hover:bg-white transition-colors">
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
        ) : colorSortMode ? (
          <GalleryColorView
            allItems={allFilteredItems}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onToggleSelect={toggleSelection}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <>
            {/* Grid Planner Section */}
            <GallerySection
              title="Grid Planner"
              icon={LayoutGrid}
              items={sections.grid}
              isCollapsed={!!collapsedSections.grid}
              onToggle={() => toggleSection('grid')}
            >
              {sections.grid.length > 0
                ? renderItems(sections.grid)
                : <p className="text-sm text-dark-500 py-2">No items in grid planner</p>}
            </GallerySection>

            {/* Reels & TikTok Section */}
            <GallerySection
              title="Reels & TikTok"
              icon={Film}
              items={sections.reels}
              isCollapsed={!!collapsedSections.reels}
              onToggle={() => toggleSection('reels')}
            >
              {sections.reels.length > 0
                ? renderItems(sections.reels)
                : <p className="text-sm text-dark-500 py-2">No reels or TikTok content</p>}
            </GallerySection>

            {/* YouTube Thumbnails Section */}
            <GallerySection
              title="YouTube Thumbnails"
              icon={Youtube}
              items={sections.youtube}
              isCollapsed={!!collapsedSections.youtube}
              onToggle={() => toggleSection('youtube')}
              readOnly
            >
              {sections.youtube.length > 0
                ? renderItems(sections.youtube, true, true)
                : <p className="text-sm text-dark-500 py-2">No YouTube thumbnails</p>}
            </GallerySection>

            {/* Unsorted Section */}
            <GallerySection
              title="Unsorted"
              icon={FolderOpen}
              items={sections.unsorted}
              isCollapsed={!!collapsedSections.unsorted}
              onToggle={() => toggleSection('unsorted')}
            >
              {sections.unsorted.length > 0
                ? renderItems(sections.unsorted)
                : <p className="text-sm text-dark-500 py-2">No unsorted items</p>}
            </GallerySection>
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center gap-4 text-sm text-dark-400">
        <span>{totalCount} items</span>
        <span>{sections.grid.length} in grid</span>
        <span>{sections.reels.length} reels</span>
        <span>{sections.youtube.length} YouTube</span>
        <span>{sections.unsorted.length} unsorted</span>
        <span className="ml-auto text-dark-500">
          Gallery
        </span>
      </div>
    </div>
  );
}

export default MediaLibrary;
