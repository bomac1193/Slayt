import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CROP_PRESETS } from './constants';

const QuickEditPanel = React.memo(function QuickEditPanel({
  platform,
  currentDraft,
  saving,
  cropperRef,
  cropEditor,
  onSwitchPlatform,
  onSetActiveTab,
  onSetCropAspect,
  onRotate,
  onFlip,
  onReset,
  onSave,
  onClose,
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`hidden lg:block absolute top-14 bottom-3 z-40 border border-dark-700 bg-dark-900/95 backdrop-blur-sm overflow-hidden transition-all duration-200 shadow-2xl ${
        expanded ? 'w-[232px] -left-[244px]' : 'w-11 -left-[56px]'
      }`}
    >
      {/* Header */}
      <div className="h-10 border-b border-dark-700 flex items-center justify-between px-2">
        {expanded ? (
          <>
            <span className="text-[11px] uppercase tracking-wide text-dark-400">Quick Edit</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setExpanded(false)} className="w-7 h-7 flex items-center justify-center text-dark-400 hover:text-dark-100" title="Collapse">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-xs text-dark-400 hover:text-dark-100 px-1">Close</button>
            </div>
          </>
        ) : (
          <button onClick={() => setExpanded(true)} className="w-full h-full flex items-center justify-center text-dark-300 hover:text-dark-100" title="Expand">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {!expanded ? (
        <div className="h-full flex items-center justify-center pb-10">
          <span className="text-[10px] tracking-[0.18em] uppercase text-dark-500 [writing-mode:vertical-rl] rotate-180">Quick Edit</span>
        </div>
      ) : (
        <div className="overflow-auto p-3 space-y-4 h-[calc(100%-2.5rem)]">

          {/* Platform */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider">Platform</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'instagram', label: 'IG' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'twitter', label: 'X' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSwitchPlatform(s.id); onSetActiveTab(s.id); }}
                  className={`h-8 px-2 text-[11px] border transition-colors ${
                    platform === s.id
                      ? 'bg-dark-600 border-dark-400 text-dark-100'
                      : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop Ratio */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-dark-400 uppercase tracking-wider">Crop Ratio</h4>
            <div className="flex flex-wrap gap-1">
              {CROP_PRESETS.filter((p) => ['free', '1:1', '4:5', '9:16', '16:9'].includes(p.id)).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSetCropAspect(preset.id)}
                  className={`h-7 px-2 text-[10px] border transition-colors ${
                    (currentDraft.cropAspect || 'free') === preset.id
                      ? 'bg-dark-600 border-dark-400 text-dark-100'
                      : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rotate */}
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onRotate(-90)} className="h-8 px-2 text-[11px] border bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100 flex items-center justify-center gap-1">
              <RotateCcw className="w-3 h-3" /> Left
            </button>
            <button onClick={() => onRotate(90)} className="h-8 px-2 text-[11px] border bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100 flex items-center justify-center gap-1">
              <RotateCw className="w-3 h-3" /> Right
            </button>
          </div>

          {/* Flip */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onFlip('h')}
              className={`h-8 px-2 text-[11px] border flex items-center justify-center gap-1 transition-colors ${
                currentDraft.flipH
                  ? 'bg-dark-600 border-dark-400 text-dark-100'
                  : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100'
              }`}
            >
              <FlipHorizontal2 className="w-3 h-3" /> Flip H
            </button>
            <button
              onClick={() => onFlip('v')}
              className={`h-8 px-2 text-[11px] border flex items-center justify-center gap-1 transition-colors ${
                currentDraft.flipV
                  ? 'bg-dark-600 border-dark-400 text-dark-100'
                  : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100'
              }`}
            >
              <FlipVertical2 className="w-3 h-3" /> Flip V
            </button>
          </div>

          {/* Zoom */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => cropperRef.current?.zoomImage(1.25)}
              className="h-8 px-2 text-[11px] border bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100 flex items-center justify-center gap-1"
            >
              <ZoomIn className="w-3 h-3" /> Zoom In
            </button>
            <button
              onClick={() => cropperRef.current?.zoomImage(0.8)}
              className="h-8 px-2 text-[11px] border bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100 flex items-center justify-center gap-1"
            >
              <ZoomOut className="w-3 h-3" /> Zoom Out
            </button>
          </div>

          <p className="text-[11px] text-dark-400">Drag crop box to resize or reposition.</p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onReset} className="h-8 px-2 text-[11px] border bg-dark-800 border-dark-700 text-dark-300 hover:text-dark-100">
              Reset
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="h-8 px-2 text-[11px] border bg-dark-100 border-dark-100 text-dark-900 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Crop Editor */}
          {cropEditor && (
            <div className="-mx-3">
              {cropEditor}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default QuickEditPanel;
