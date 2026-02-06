import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { youtubeApi } from '../../lib/api';
import {
  Folder,
  FolderOpen,
  Plus,
  Youtube,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  GripVertical,
  Trash2,
  Pencil,
} from 'lucide-react';
import EditableCollectionName from './EditableCollectionName';

/**
 * YouTube Collections Manager
 * Organized view with folders, inline editing, and drag-and-drop
 */
function YouTubeCollectionsManager({ onSelectCollection, selectedCollectionId }) {
  const youtubeCollections = useAppStore((state) => state.youtubeCollections);
  const updateYoutubeCollection = useAppStore((state) => state.updateYoutubeCollection);
  const addYoutubeCollection = useAppStore((state) => state.addYoutubeCollection);
  const deleteYoutubeCollection = useAppStore((state) => state.deleteYoutubeCollection);

  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [draggedCollection, setDraggedCollection] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [dragOverCollection, setDragOverCollection] = useState(null);
  const [selectedFolders, setSelectedFolders] = useState(new Set());
  const [lastClickedFolder, setLastClickedFolder] = useState(null);
  const [emptyFolders, setEmptyFolders] = useState(new Set()); // Folders without collections yet
  const [renameMode, setRenameMode] = useState(false); // Toggle for enabling/disabling rename

  // Clear selection on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedFolders.size > 0) {
        setSelectedFolders(new Set());
        setLastClickedFolder(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFolders.size]);

  // Group collections by folder with safety checks
  const collectionsByFolder = React.useMemo(() => {
    try {
      return (youtubeCollections || []).reduce((acc, collection) => {
        if (!collection) return acc;
        const folder = collection.folder || 'root';
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(collection);
        return acc;
      }, {});
    } catch (error) {
      console.error('[collectionsByFolder] Error grouping collections:', error);
      return { root: [] };
    }
  }, [youtubeCollections]);

  // Sort collections within folders by position
  Object.keys(collectionsByFolder).forEach(folder => {
    if (collectionsByFolder[folder]) {
      collectionsByFolder[folder].sort((a, b) => ((a?.position || 0) - (b?.position || 0)));
    }
  });

  const folders = React.useMemo(() => {
    try {
      const keys = Object.keys(collectionsByFolder || {});
      const nonRootFolders = keys.filter(f => f && f !== 'root');
      // Combine folders with collections and empty folders
      const allFolders = new Set([...nonRootFolders, ...Array.from(emptyFolders)]);
      return ['root', ...Array.from(allFolders).sort()];
    } catch (error) {
      console.error('[folders] Error generating folder list:', error);
      return ['root'];
    }
  }, [collectionsByFolder, emptyFolders]);

  const toggleFolder = (folder) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSaveCollectionName = async (collectionId, newName) => {
    try {
      await youtubeApi.updateCollection(collectionId, { name: newName });
      updateYoutubeCollection(collectionId, { name: newName });
    } catch (error) {
      console.error('Failed to update collection name:', error);
      throw error;
    }
  };

  const handleRenameFolder = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName) {
      setEditingFolder(null);
      return;
    }

    try {
      // Update all collections in this folder
      const collectionsInFolder = collectionsByFolder[oldName] || [];
      for (const collection of collectionsInFolder) {
        await youtubeApi.updateCollection(collection.id || collection._id, { folder: newName });
        updateYoutubeCollection(collection.id || collection._id, { folder: newName });
      }

      // Update expanded state
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(oldName)) {
        newExpanded.delete(oldName);
        newExpanded.add(newName);
      }
      setExpandedFolders(newExpanded);
      setEditingFolder(null);
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleFolderClick = (folder, event) => {
    // Don't select root folder
    if (folder === 'root') return;

    // Don't interfere with editing
    if (editingFolder) return;

    const isShift = event.shiftKey;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isShift && lastClickedFolder && lastClickedFolder !== 'root') {
      // Shift-click: select range
      const allFolders = folders.filter(f => f !== 'root');
      const lastIndex = allFolders.indexOf(lastClickedFolder);
      const currentIndex = allFolders.indexOf(folder);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const range = allFolders.slice(start, end + 1);

        const newSelected = new Set(selectedFolders);
        range.forEach(f => newSelected.add(f));
        setSelectedFolders(newSelected);
      }
    } else if (isCtrlOrCmd) {
      // Ctrl/Cmd-click: toggle selection
      const newSelected = new Set(selectedFolders);
      if (newSelected.has(folder)) {
        newSelected.delete(folder);
      } else {
        newSelected.add(folder);
      }
      setSelectedFolders(newSelected);
      setLastClickedFolder(folder);
    } else {
      // Regular click: select only this folder
      setSelectedFolders(new Set([folder]));
      setLastClickedFolder(folder);
    }
  };

  const handleDeleteSelectedFolders = async () => {
    if (selectedFolders.size === 0) return;

    const foldersToDelete = Array.from(selectedFolders);
    let totalCollections = 0;

    // Count total collections
    foldersToDelete.forEach(folder => {
      const collections = collectionsByFolder[folder] || [];
      totalCollections += collections.length;
    });

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${foldersToDelete.length} folder${foldersToDelete.length === 1 ? '' : 's'}?\n\n` +
      `Folders: ${foldersToDelete.join(', ')}\n\n` +
      `This will delete ${totalCollections} collection${totalCollections === 1 ? '' : 's'} and all their videos.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Delete all collections in all selected folders
      for (const folder of foldersToDelete) {
        const collectionsInFolder = collectionsByFolder[folder] || [];
        for (const collection of collectionsInFolder) {
          const collectionId = collection.id || collection._id;
          await youtubeApi.deleteCollection(collectionId);
          deleteYoutubeCollection(collectionId);
        }
      }

      // Remove from expanded state
      const newExpanded = new Set(expandedFolders);
      foldersToDelete.forEach(f => newExpanded.delete(f));
      setExpandedFolders(newExpanded);

      // Clear selection
      setSelectedFolders(new Set());
      setLastClickedFolder(null);

      console.log(`✅ Deleted ${foldersToDelete.length} folders with ${totalCollections} collections`);
    } catch (error) {
      console.error('Failed to delete folders:', error);
      alert(`Failed to delete folders: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteFolder = async (folderName) => {
    const collectionsInFolder = collectionsByFolder[folderName] || [];
    const count = collectionsInFolder.length;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the folder "${folderName}"?\n\n` +
      `This will delete ${count} collection${count === 1 ? '' : 's'} and all their videos.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Delete all collections in this folder
      for (const collection of collectionsInFolder) {
        const collectionId = collection.id || collection._id;
        await youtubeApi.deleteCollection(collectionId);
        deleteYoutubeCollection(collectionId);
      }

      // Remove from expanded state
      const newExpanded = new Set(expandedFolders);
      newExpanded.delete(folderName);
      setExpandedFolders(newExpanded);

      console.log(`✅ Deleted folder "${folderName}" with ${count} collections`);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert(`Failed to delete folder: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCreateFolder = () => {
    console.log('[handleCreateFolder] Starting folder creation...');

    if (!newFolderName.trim()) {
      console.log('[handleCreateFolder] Empty folder name, aborting');
      return;
    }

    const folderName = newFolderName.trim();
    console.log('[handleCreateFolder] Creating empty folder:', folderName);

    // Check if folder already exists
    if (folders.includes(folderName)) {
      alert(`Folder "${folderName}" already exists`);
      return;
    }

    // Add to empty folders set (will persist when collection is added)
    const newEmptyFolders = new Set(emptyFolders);
    newEmptyFolders.add(folderName);
    setEmptyFolders(newEmptyFolders);

    // Expand the new folder
    const newExpanded = new Set(expandedFolders);
    newExpanded.add(folderName);
    setExpandedFolders(newExpanded);

    // Reset form
    setIsCreatingFolder(false);
    setNewFolderName('');

    console.log('[handleCreateFolder] ✅ Empty folder created (will persist when collection added)');
  };

  const handleDragStart = (e, collection) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCollection(collection);
  };

  const handleDragOver = (e, folder) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folder);
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedCollection) return;

    const collectionId = draggedCollection.id || draggedCollection._id;
    const newFolder = targetFolder === 'root' ? null : targetFolder;

    if (draggedCollection.folder === newFolder) {
      setDraggedCollection(null);
      return;
    }

    try {
      await youtubeApi.updateCollection(collectionId, { folder: newFolder });
      updateYoutubeCollection(collectionId, { folder: newFolder });

      // Remove from empty folders if it was empty
      if (emptyFolders.has(targetFolder)) {
        const newEmptyFolders = new Set(emptyFolders);
        newEmptyFolders.delete(targetFolder);
        setEmptyFolders(newEmptyFolders);
        console.log(`✅ Folder "${targetFolder}" now has collections, removed from empty folders`);
      }

      setDraggedCollection(null);
    } catch (error) {
      console.error('Failed to move collection:', error);
      setDraggedCollection(null);
    }
  };

  const handleCollectionDragOver = (e, targetCollection) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const targetId = targetCollection.id || targetCollection._id;
    const draggedId = draggedCollection?.id || draggedCollection?._id;

    if (draggedId !== targetId) {
      setDragOverCollection(targetId);
    }
  };

  const handleCollectionDrop = async (e, targetCollection) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCollection(null);

    if (!draggedCollection) return;

    const draggedId = draggedCollection.id || draggedCollection._id;
    const targetId = targetCollection.id || targetCollection._id;

    // Don't reorder if dropping on itself
    if (draggedId === targetId) {
      setDraggedCollection(null);
      return;
    }

    // Get the folder these collections are in
    const draggedFolder = draggedCollection.folder || 'root';
    const targetFolder = targetCollection.folder || 'root';

    // Only reorder within the same folder
    if (draggedFolder !== targetFolder) {
      setDraggedCollection(null);
      return;
    }

    try {
      // Get all collections in this folder
      const collectionsInFolder = (collectionsByFolder[draggedFolder] || []).slice();

      // Find current positions
      const draggedIndex = collectionsInFolder.findIndex(c =>
        (c.id || c._id) === draggedId
      );
      const targetIndex = collectionsInFolder.findIndex(c =>
        (c.id || c._id) === targetId
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedCollection(null);
        return;
      }

      // Reorder the array
      const [removed] = collectionsInFolder.splice(draggedIndex, 1);
      collectionsInFolder.splice(targetIndex, 0, removed);

      // Update positions for all collections
      for (let i = 0; i < collectionsInFolder.length; i++) {
        const collection = collectionsInFolder[i];
        const collectionId = collection.id || collection._id;
        const newPosition = i;

        // Only update if position changed
        if (collection.position !== newPosition) {
          await youtubeApi.updateCollection(collectionId, { position: newPosition });
          updateYoutubeCollection(collectionId, { position: newPosition });
        }
      }

      console.log(`✅ Reordered collections in folder "${draggedFolder}"`);
      setDraggedCollection(null);
    } catch (error) {
      console.error('Failed to reorder collections:', error);
      setDraggedCollection(null);
    }
  };

  const handleCreateCollection = async (folder = null) => {
    try {
      const collection = await youtubeApi.createCollection({
        name: 'New Collection',
        folder: folder === 'root' ? null : folder,
      });
      addYoutubeCollection(collection.collection);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleDeleteCollection = async (collectionId, collectionName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the collection "${collectionName}"?\n\n` +
      `This will delete all videos in this collection.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await youtubeApi.deleteCollection(collectionId);
      deleteYoutubeCollection(collectionId);
      console.log(`✅ Deleted collection "${collectionName}"`);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      alert(`Failed to delete collection: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-dark-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-dark-100">YouTube Collections</h3>
          <button
            type="button"
            onClick={() => setRenameMode(!renameMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              renameMode
                ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                : 'bg-dark-700 text-dark-400 border border-dark-600 hover:text-dark-200 hover:border-dark-500'
            }`}
            title={renameMode ? 'Disable rename mode' : 'Enable rename mode'}
          >
            <Pencil className="w-3 h-3" />
            <span>{renameMode ? 'Rename: ON' : 'Rename: OFF'}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingFolder(true)}
          className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-dark-600 rounded-lg text-dark-400 hover:border-accent-purple hover:text-accent-purple transition-colors text-sm"
        >
          <Folder className="w-4 h-4" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Create Folder Input */}
      {isCreatingFolder && (
        <div className="px-4 py-2 bg-dark-750 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateFolder();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-sm text-white focus:outline-none focus:border-accent-purple"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              className="p-1 text-green-400 hover:text-green-300"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selection Bar */}
      {selectedFolders.size > 0 && (
        <div className="px-4 py-2 bg-accent-purple/10 border-b border-accent-purple/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-accent-purple font-medium">
              {selectedFolders.size} folder{selectedFolders.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteSelectedFolders}
                className="px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFolders(new Set());
                  setLastClickedFolder(null);
                }}
                className="px-2 py-1 text-xs bg-dark-700 text-dark-300 hover:bg-dark-600 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders and Collections */}
      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => {
          const isExpanded = expandedFolders.has(folder);
          const collections = collectionsByFolder[folder] || [];
          const isRoot = folder === 'root';
          const isSelected = selectedFolders.has(folder);
          const isDragOver = dragOverFolder === folder;

          return (
            <div key={folder}>
              {/* Folder Header */}
              <div
                className={`sticky top-0 border-b z-10 transition-colors ${
                  isDragOver
                    ? 'bg-accent-purple/20 border-accent-purple'
                    : 'bg-dark-750 border-dark-700'
                }`}
                onDragOver={(e) => handleDragOver(e, folder)}
                onDragLeave={() => setDragOverFolder(null)}
                onDrop={(e) => handleDrop(e, folder)}
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 transition-colors focus:outline-none cursor-pointer ${
                    isSelected
                      ? 'bg-accent-purple/20 border-l-2 border-accent-purple'
                      : 'hover:bg-dark-700'
                  }`}
                  tabIndex={isRoot ? -1 : 0}
                  onClick={(e) => {
                    // Don't interfere with button clicks
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                    handleFolderClick(folder, e);
                  }}
                  onKeyDown={(e) => {
                    if (!isRoot && (e.key === 'Delete' || e.key === 'Backspace')) {
                      e.preventDefault();
                      // Delete selected folders if any, otherwise delete this folder
                      if (selectedFolders.size > 0) {
                        handleDeleteSelectedFolders();
                      } else {
                        handleDeleteFolder(folder);
                      }
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder)}
                    className="p-0.5 text-dark-400 hover:text-dark-200"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-yellow-500" />
                  )}

                  {/* Folder Name */}
                  {editingFolder === folder ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        defaultValue={folder}
                        onBlur={(e) => handleRenameFolder(folder, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameFolder(folder, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingFolder(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-0.5 bg-dark-600 border border-accent-purple rounded text-sm text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1 group/folder">
                      <span className="text-sm font-medium text-dark-100">
                        {isRoot ? 'Uncategorized' : folder}
                      </span>
                      <span className="text-xs text-dark-500">({collections.length})</span>
                      {!isRoot && (
                        <>
                          {renameMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolder(folder);
                              }}
                              className="p-0.5 text-dark-500 hover:text-accent-purple transition-colors opacity-0 group-hover/folder:opacity-100"
                              title="Rename folder"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // If folders are selected and this is one of them, delete all selected
                              // Otherwise just delete this folder
                              if (selectedFolders.size > 0 && selectedFolders.has(folder)) {
                                handleDeleteSelectedFolders();
                              } else {
                                handleDeleteFolder(folder);
                              }
                            }}
                            className={`p-0.5 text-dark-500 hover:text-red-400 transition-colors ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover/folder:opacity-100'
                            }`}
                            title={
                              selectedFolders.size > 0 && selectedFolders.has(folder)
                                ? `Delete ${selectedFolders.size} selected folder${selectedFolders.size === 1 ? '' : 's'}`
                                : 'Delete folder (and all collections inside)'
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                            {selectedFolders.size > 1 && isSelected && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {selectedFolders.size}
                              </span>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCreateCollection(folder)}
                    className="p-1 text-dark-500 hover:text-accent-purple transition-colors"
                    title="Add collection to this folder"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collections in Folder */}
              {isExpanded && (
                <div className="py-1">
                  {collections.length === 0 ? (
                    <div className="px-4 py-4 text-center text-dark-500 text-sm">
                      No collections
                    </div>
                  ) : (
                    collections.map((collection) => {
                      const collectionId = collection.id || collection._id;
                      const isSelected = collectionId === selectedCollectionId;
                      const isDraggedOver = dragOverCollection === collectionId;

                      return (
                        <div
                          key={collectionId}
                          draggable
                          tabIndex={0}
                          onDragStart={(e) => handleDragStart(e, collection)}
                          onDragOver={(e) => handleCollectionDragOver(e, collection)}
                          onDragLeave={() => setDragOverCollection(null)}
                          onDrop={(e) => handleCollectionDrop(e, collection)}
                          className={`flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-inset relative ${
                            isSelected ? 'bg-dark-700 border-l-2 border-accent-purple' : ''
                          } ${
                            isDraggedOver ? 'border-t-2 border-blue-400' : ''
                          }`}
                          onClick={() => onSelectCollection?.(collectionId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Delete' || e.key === 'Backspace') {
                              e.preventDefault();
                              handleDeleteCollection(collectionId, collection.name);
                            }
                          }}
                        >
                          <GripVertical className="w-4 h-4 text-dark-600 opacity-0 group-hover:opacity-100" />
                          <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <EditableCollectionName
                            name={collection.name}
                            onSave={(newName) => handleSaveCollectionName(collectionId, newName)}
                            className="flex-1 min-w-0 text-sm text-dark-200"
                            showEditIcon={false}
                            editIconPosition="hover"
                            disabled={!renameMode}
                          />
                          <span className="text-xs text-dark-500 flex-shrink-0">
                            {collection.itemCount || 0}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(collectionId, collection.name);
                            }}
                            className="p-0.5 text-dark-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete collection"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default YouTubeCollectionsManager;
