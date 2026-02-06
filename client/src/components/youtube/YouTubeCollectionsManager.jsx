import { useState } from 'react';
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

  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [draggedCollection, setDraggedCollection] = useState(null);

  // Group collections by folder
  const collectionsByFolder = youtubeCollections.reduce((acc, collection) => {
    const folder = collection.folder || 'root';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(collection);
    return acc;
  }, {});

  // Sort collections within folders by position
  Object.keys(collectionsByFolder).forEach(folder => {
    collectionsByFolder[folder].sort((a, b) => (a.position || 0) - (b.position || 0));
  });

  const folders = ['root', ...Object.keys(collectionsByFolder).filter(f => f !== 'root').sort()];

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderName = newFolderName.trim();

    try {
      // Create a default collection in this folder to persist it
      const collection = await youtubeApi.createCollection({
        name: 'New Collection',
        folder: folderName,
      });
      addYoutubeCollection(collection.collection);

      // Expand the new folder
      const newExpanded = new Set(expandedFolders);
      newExpanded.add(folderName);
      setExpandedFolders(newExpanded);

      setIsCreatingFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  const handleDragStart = (e, collection) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCollection(collection);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
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
      setDraggedCollection(null);
    } catch (error) {
      console.error('Failed to move collection:', error);
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

  return (
    <div className="h-full flex flex-col bg-dark-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700">
        <h3 className="text-sm font-semibold text-dark-100 mb-2">YouTube Collections</h3>
        <button
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
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-sm text-white focus:outline-none focus:border-accent-purple"
            />
            <button
              onClick={handleCreateFolder}
              className="p-1 text-green-400 hover:text-green-300"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
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

      {/* Folders and Collections */}
      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => {
          const isExpanded = expandedFolders.has(folder);
          const collections = collectionsByFolder[folder] || [];
          const isRoot = folder === 'root';

          return (
            <div key={folder}>
              {/* Folder Header */}
              <div
                className="sticky top-0 bg-dark-750 border-b border-dark-700 z-10"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder)}
              >
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-dark-700 transition-colors">
                  <button
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                          }}
                          className="p-0.5 text-dark-500 hover:text-accent-purple transition-colors opacity-0 group-hover/folder:opacity-100"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <button
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

                      return (
                        <div
                          key={collectionId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, collection)}
                          className={`flex items-center gap-2 px-4 py-2 hover:bg-dark-700 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-dark-700 border-l-2 border-accent-purple' : ''
                          }`}
                          onClick={() => onSelectCollection?.(collectionId)}
                        >
                          <GripVertical className="w-4 h-4 text-dark-600 opacity-0 group-hover:opacity-100" />
                          <Youtube className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <EditableCollectionName
                            name={collection.name}
                            onSave={(newName) => handleSaveCollectionName(collectionId, newName)}
                            className="flex-1 min-w-0 text-sm text-dark-200"
                            showEditIcon={false}
                            editIconPosition="hover"
                          />
                          <span className="text-xs text-dark-500 flex-shrink-0">
                            {collection.itemCount || 0}
                          </span>
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
