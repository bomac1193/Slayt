import { useState } from 'react';
import PropTypes from 'prop-types';
import './brandkit.css';

const GOOGLE_FONTS = [
  'JetBrains Mono',
  'Inter',
  'Space Grotesk',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Raleway',
  'Work Sans',
  'DM Sans',
  'Outfit',
  'Plus Jakarta Sans',
  'Cormorant Garamond',
];

function FontSelector({ fonts, onUpdateFonts, onSelectFont }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFontName, setNewFontName] = useState('');

  const handleHeadingChange = (fontFamily) => {
    onUpdateFonts({ heading: fontFamily });
  };

  const handleBodyChange = (fontFamily) => {
    onUpdateFonts({ body: fontFamily });
  };

  const handleAddCustomFont = (e) => {
    e.preventDefault();
    if (!newFontName.trim()) return;

    // Add to custom fonts - in a real app, you'd also load the font
    const customFonts = fonts.custom || [];
    onUpdateFonts({
      custom: [...customFonts, { id: `font-${Date.now()}`, name: newFontName.trim() }]
    });

    setNewFontName('');
    setShowAddForm(false);
  };

  const handleSelectFont = (fontFamily) => {
    if (onSelectFont) {
      onSelectFont(fontFamily);
    }
  };

  const allFonts = [
    ...GOOGLE_FONTS,
    ...(fonts.custom || []).map(f => f.name)
  ];

  return (
    <div className="font-selector">
      <div className="font-section">
        <h4>Typography</h4>

        <div className="font-role">
          <label>Heading Font</label>
          <select
            value={fonts.heading || 'JetBrains Mono'}
            onChange={(e) => handleHeadingChange(e.target.value)}
            style={{ fontFamily: fonts.heading || 'JetBrains Mono' }}
          >
            {allFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          <div
            className="font-preview heading"
            style={{ fontFamily: fonts.heading || 'JetBrains Mono' }}
          >
            The quick brown fox jumps
          </div>
        </div>

        <div className="font-role">
          <label>Body Font</label>
          <select
            value={fonts.body || 'Inter'}
            onChange={(e) => handleBodyChange(e.target.value)}
            style={{ fontFamily: fonts.body || 'Inter' }}
          >
            {allFonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          <div
            className="font-preview body"
            style={{ fontFamily: fonts.body || 'Inter' }}
          >
            The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
          </div>
        </div>
      </div>

      <div className="font-section">
        <div className="font-section-header">
          <h4>Font Library</h4>
          <button
            type="button"
            className="font-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Font
          </button>
        </div>

        {showAddForm && (
          <form className="font-add-form" onSubmit={handleAddCustomFont}>
            <input
              type="text"
              placeholder="Font name (e.g., Custom Font)"
              value={newFontName}
              onChange={(e) => setNewFontName(e.target.value)}
            />
            <button type="submit" className="primary">Add</button>
            <button type="button" className="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </form>
        )}

        <div className="font-library">
          {allFonts.map((font) => (
            <button
              key={font}
              type="button"
              className="font-library-item"
              onClick={() => handleSelectFont(font)}
              style={{ fontFamily: font }}
            >
              <span className="font-library-name">{font}</span>
              <span className="font-library-preview" style={{ fontFamily: font }}>
                Aa
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

FontSelector.propTypes = {
  fonts: PropTypes.shape({
    heading: PropTypes.string,
    body: PropTypes.string,
    custom: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })),
  }).isRequired,
  onUpdateFonts: PropTypes.func.isRequired,
  onSelectFont: PropTypes.func,
};

FontSelector.defaultProps = {
  onSelectFont: null,
};

export default FontSelector;
