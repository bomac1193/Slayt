import React, { useState } from 'react';
import { Cropper } from 'react-advanced-cropper';
import { ChevronDown, ChevronUp } from 'lucide-react';
import 'react-advanced-cropper/dist/style.css';

const CropEditor = React.memo(function CropEditor({
  cropperKey,
  cropperRef,
  src,
  onChange,
  defaultCoordinates,
  aspectRatio,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-dark-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-dark-400 hover:text-dark-200 transition-colors"
      >
        <span className="uppercase tracking-wide">Crop Editor</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {src ? (
            <Cropper
              key={cropperKey}
              ref={cropperRef}
              src={src}
              onChange={onChange}
              defaultCoordinates={defaultCoordinates}
              stencilProps={{
                aspectRatio,
                movable: true,
                resizable: true,
                grid: true,
              }}
              style={{ height: '100%', width: '100%' }}
              imageRestriction="fitArea"
              transitions={false}
            />
          ) : (
            <div className="text-dark-500 flex items-center justify-center h-full text-xs">No image</div>
          )}
        </div>
      )}
    </div>
  );
});

export default CropEditor;
