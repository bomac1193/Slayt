import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Type,
  Sliders,
  Palette,
  Sparkles,
  Download,
  Settings,
  Eye,
  History,
  Wand2,
  PenTool,
  Eraser,
  Move,
  Square,
  Circle,
  ArrowLeft,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', icon: Move, label: 'Select' },
  { id: 'crop', icon: Square, label: 'Crop' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'draw', icon: PenTool, label: 'Draw' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'shapes', icon: Circle, label: 'Shapes' },
];

const TABS = [
  { id: 'adjust', icon: Sliders, label: 'Adjust' },
  { id: 'filters', icon: Sparkles, label: 'Filters' },
  { id: 'effects', icon: Wand2, label: 'Effects' },
  { id: 'colors', icon: Palette, label: 'Colors' },
  { id: 'layers', icon: Layers, label: 'Layers' },
];

function ProEditor() {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState('select');
  const [activeTab, setActiveTab] = useState('adjust');

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Top Bar */}
      <div className="h-12 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 text-dark-400 hover:text-dark-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Quick Editor</span>
          </button>
          <div className="w-px h-6 bg-dark-700" />
          <span className="text-sm font-medium text-dark-200">Pro Editor</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-icon">
            <History className="w-4 h-4" />
          </button>
          <button className="btn-icon">
            <Eye className="w-4 h-4" />
          </button>
          <button className="btn-icon">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-dark-700" />
          <button className="btn-secondary text-sm py-1.5">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Tools */}
        <div className="w-14 bg-dark-800 border-r border-dark-700 flex flex-col items-center py-2 gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTool === tool.id
                  ? 'bg-accent-purple text-white'
                  : 'text-dark-400 hover:bg-dark-700 hover:text-dark-200'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-dark-900 flex items-center justify-center">
          <div className="text-center">
            <Wand2 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-dark-300 mb-2">Pro Editor</h2>
            <p className="text-dark-500 max-w-md">
              Advanced editing with curves, levels, HSL control, text overlays,
              layers, and professional effects. Coming soon.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 bg-dark-800 border-l border-dark-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-dark-700">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent-purple border-b-2 border-accent-purple'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                <p className="text-sm text-dark-400">
                  Pro adjustment controls will appear here:
                </p>
                <ul className="text-sm text-dark-500 space-y-2">
                  <li>• Curves adjustment</li>
                  <li>• Levels control</li>
                  <li>• HSL per-channel</li>
                  <li>• Color balance</li>
                  <li>• Vibrance & Saturation</li>
                  <li>• Highlights & Shadows</li>
                </ul>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-4">
                <p className="text-sm text-dark-400">
                  Advanced filter presets and custom filter creation.
                </p>
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="space-y-4">
                <p className="text-sm text-dark-400">
                  Effects available:
                </p>
                <ul className="text-sm text-dark-500 space-y-2">
                  <li>• Vignette</li>
                  <li>• Grain/Noise</li>
                  <li>• Gaussian Blur</li>
                  <li>• Motion Blur</li>
                  <li>• Radial Blur</li>
                  <li>• Sharpen</li>
                </ul>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-4">
                <p className="text-sm text-dark-400">
                  Color tools:
                </p>
                <ul className="text-sm text-dark-500 space-y-2">
                  <li>• Color picker</li>
                  <li>• Gradient overlays</li>
                  <li>• Color replacement</li>
                  <li>• Duotone effects</li>
                </ul>
              </div>
            )}

            {activeTab === 'layers' && (
              <div className="space-y-4">
                <p className="text-sm text-dark-400">
                  Layer management:
                </p>
                <ul className="text-sm text-dark-500 space-y-2">
                  <li>• Add/remove layers</li>
                  <li>• Blend modes</li>
                  <li>• Opacity control</li>
                  <li>• Layer ordering</li>
                  <li>• Watermark presets</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProEditor;
