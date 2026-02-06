import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

/**
 * Editable Collection Name Component
 * Click name or edit icon to edit inline, save on Enter/blur
 */
function EditableCollectionName({
  name,
  onSave,
  className = '',
  showEditIcon = true,
  editIconPosition = 'right' // 'right' or 'hover'
}) {
  // Defensive: ensure name is always a string
  const safeName = typeof name === 'string' ? name : (name?.name || 'Unnamed');

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(safeName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditedName(safeName);
  }, [safeName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editedName.trim() || editedName === safeName) {
      setIsEditing(false);
      setEditedName(safeName);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save collection name:', error);
      setEditedName(safeName); // Revert on error
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(safeName);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="flex-1 min-w-0 px-2 py-0.5 bg-dark-600 border border-accent-purple rounded text-sm text-white focus:outline-none"
          placeholder="Collection name..."
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-0.5 text-green-400 hover:text-green-300 disabled:opacity-50"
          title="Save (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-0.5 text-red-400 hover:text-red-300 disabled:opacity-50"
          title="Cancel (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 group/name ${className}`}>
      <span
        onClick={() => setIsEditing(true)}
        className="cursor-pointer hover:text-accent-purple transition-colors"
        title="Click to edit"
      >
        {safeName}
      </span>
      {showEditIcon && editIconPosition === 'right' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-0.5 text-dark-500 hover:text-accent-purple transition-colors"
          title="Edit name"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
      {showEditIcon && editIconPosition === 'hover' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-0.5 text-dark-500 hover:text-accent-purple transition-colors opacity-0 group-hover/name:opacity-100"
          title="Edit name"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default EditableCollectionName;
