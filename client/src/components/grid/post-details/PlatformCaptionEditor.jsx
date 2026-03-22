import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Link, Unlink } from 'lucide-react';

const PlatformCaptionEditor = React.memo(function PlatformCaptionEditor({
  platform,
  caption,
  isCustom,
  onUpdate,
  onPersist,
  onClearCustom,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(caption);
  const [customMode, setCustomMode] = useState(isCustom);
  const textareaRef = useRef(null);

  useEffect(() => {
    setDraft(caption);
    setCustomMode(isCustom);
  }, [caption, isCustom]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // Auto-resize on mount and when caption changes
  useEffect(() => {
    autoResize();
  }, [caption, autoResize]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const platformLabel = platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1);

  const handleSave = () => {
    onPersist(platform, draft, customMode);
    setEditing(false);
  };

  const handleToggleCustom = () => {
    if (customMode) {
      onClearCustom(platform);
      setCustomMode(false);
      setEditing(false);
    } else {
      setCustomMode(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setDraft(caption);
      setEditing(false);
    }
  };

  const handleClick = () => {
    if (!editing) setEditing(true);
  };

  const isEmpty = !draft && !editing;

  return (
    <div className="mt-1">
      <div className="relative group cursor-text" onClick={handleClick}>
        <textarea
          ref={textareaRef}
          value={draft}
          readOnly={!editing}
          onChange={(e) => {
            setDraft(e.target.value);
            onUpdate(platform, e.target.value, customMode);
            autoResize();
          }}
          onBlur={() => { if (editing) handleSave(); }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent text-sm leading-relaxed p-0 m-0 resize-none border-none overflow-hidden cursor-text ${
            editing ? 'text-gray-300' : isEmpty ? 'text-gray-600' : 'text-gray-300 group-hover:text-white transition-colors'
          }`}
          placeholder="Add a caption..."
          style={{ outline: 'none', boxShadow: 'none', caretColor: editing ? undefined : 'transparent' }}
        />
      </div>
      {(editing || isCustom) && <div className="flex items-center justify-between mt-1.5">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleCustom}
          className={`flex items-center gap-1 text-[11px] transition-colors ${
            customMode
              ? 'text-dark-300 hover:text-white'
              : 'text-dark-500 hover:text-dark-300'
          }`}
          title={customMode ? `Using custom caption for ${platformLabel} — click to use general` : `Click to customize for ${platformLabel} only`}
        >
          {customMode ? (
            <>
              <Unlink className="w-3 h-3" />
              Custom for {platformLabel}
            </>
          ) : (
            <>
              <Link className="w-3 h-3" />
              All platforms
            </>
          )}
        </button>
        <div className="flex items-center gap-2">
          {editing && <span className="text-[11px] text-dark-600">{draft.length}/2200</span>}
          {editing && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
              className="flex items-center gap-1 text-[11px] text-green-500 hover:text-green-400 transition-colors"
              title="Save caption"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
          )}
        </div>
      </div>}
    </div>
  );
});

export default PlatformCaptionEditor;
