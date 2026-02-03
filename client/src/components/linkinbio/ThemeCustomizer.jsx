import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './linkinbio.css';

const PRESET_THEMES = [
  {
    name: 'Classic Light',
    theme: {
      backgroundColor: '#f4f0ea',
      textColor: '#110f0e',
      buttonStyle: 'filled',
      buttonColor: '#111111',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Dark Mode',
    theme: {
      backgroundColor: '#1a1816',
      textColor: '#f4f0ea',
      buttonStyle: 'filled',
      buttonColor: '#ffffff',
      buttonTextColor: '#1a1816',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Ocean Blue',
    theme: {
      backgroundColor: '#e8f4f8',
      textColor: '#1a3a4a',
      buttonStyle: 'filled',
      buttonColor: '#2196F3',
      buttonTextColor: '#ffffff',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Sunset',
    theme: {
      backgroundColor: '#fff5e6',
      textColor: '#4a2c00',
      buttonStyle: 'soft',
      buttonColor: '#ff6b35',
      buttonTextColor: '#ffffff',
      fontFamily: 'Poppins',
    },
  },
  {
    name: 'Minimal',
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonStyle: 'outlined',
      buttonColor: '#000000',
      buttonTextColor: '#000000',
      fontFamily: 'Inter',
    },
  },
  {
    name: 'Forest',
    theme: {
      backgroundColor: '#e8f5e9',
      textColor: '#1b5e20',
      buttonStyle: 'rounded',
      buttonColor: '#4CAF50',
      buttonTextColor: '#ffffff',
      fontFamily: 'Nunito',
    },
  },
];

const BUTTON_STYLES = [
  { value: 'filled', label: 'Filled' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'soft', label: 'Soft' },
  { value: 'rounded', label: 'Rounded' },
];

const FONT_OPTIONS = [
  'Inter',
  'JetBrains Mono',
  'Space Grotesk',
  'Poppins',
  'Nunito',
  'Montserrat',
  'Open Sans',
  'Roboto',
  'Lato',
];

function ThemeCustomizer({ theme, onUpdateTheme, saving }) {
  const [localTheme, setLocalTheme] = useState(theme);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleChange = (key, value) => {
    const newTheme = { ...localTheme, [key]: value };
    setLocalTheme(newTheme);
  };

  const handleApply = () => {
    onUpdateTheme(localTheme);
  };

  const applyPreset = (preset) => {
    setLocalTheme(preset.theme);
    onUpdateTheme(preset.theme);
  };

  return (
    <div className="theme-customizer">
      <div className="theme-customizer-section">
        <h4>Preset Themes</h4>
        <div className="theme-presets">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="theme-preset-btn"
              onClick={() => applyPreset(preset)}
              style={{
                backgroundColor: preset.theme.backgroundColor,
                color: preset.theme.textColor,
                borderColor: preset.theme.buttonColor,
              }}
            >
              <span
                className="theme-preset-sample"
                style={{ backgroundColor: preset.theme.buttonColor }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="theme-customizer-section">
        <h4>Colors</h4>
        <div className="theme-color-grid">
          <div className="theme-color-field">
            <label>Background</label>
            <div className="theme-color-input">
              <input
                type="color"
                value={localTheme.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
              />
              <input
                type="text"
                value={localTheme.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
              />
            </div>
          </div>

          <div className="theme-color-field">
            <label>Text</label>
            <div className="theme-color-input">
              <input
                type="color"
                value={localTheme.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
              />
              <input
                type="text"
                value={localTheme.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
              />
            </div>
          </div>

          <div className="theme-color-field">
            <label>Button</label>
            <div className="theme-color-input">
              <input
                type="color"
                value={localTheme.buttonColor}
                onChange={(e) => handleChange('buttonColor', e.target.value)}
              />
              <input
                type="text"
                value={localTheme.buttonColor}
                onChange={(e) => handleChange('buttonColor', e.target.value)}
              />
            </div>
          </div>

          <div className="theme-color-field">
            <label>Button Text</label>
            <div className="theme-color-input">
              <input
                type="color"
                value={localTheme.buttonTextColor}
                onChange={(e) => handleChange('buttonTextColor', e.target.value)}
              />
              <input
                type="text"
                value={localTheme.buttonTextColor}
                onChange={(e) => handleChange('buttonTextColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="theme-customizer-section">
        <h4>Button Style</h4>
        <div className="theme-button-styles">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              className={`theme-style-btn ${localTheme.buttonStyle === style.value ? 'active' : ''}`}
              onClick={() => handleChange('buttonStyle', style.value)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="theme-customizer-section">
        <h4>Font</h4>
        <select
          value={localTheme.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          className="theme-font-select"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div className="theme-customizer-actions">
        <button
          type="button"
          className="theme-apply-btn primary"
          onClick={handleApply}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Apply Changes'}
        </button>
      </div>
    </div>
  );
}

ThemeCustomizer.propTypes = {
  theme: PropTypes.shape({
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string,
    buttonStyle: PropTypes.string,
    buttonColor: PropTypes.string,
    buttonTextColor: PropTypes.string,
    fontFamily: PropTypes.string,
  }).isRequired,
  onUpdateTheme: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

ThemeCustomizer.defaultProps = {
  saving: false,
};

export default ThemeCustomizer;
