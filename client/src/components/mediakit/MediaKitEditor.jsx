import { useState } from 'react';
import PropTypes from 'prop-types';
import StatsDisplay from './StatsDisplay';
import './mediakit.css';

const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
  { id: 'professional', name: 'Professional', description: 'Business-focused' },
  { id: 'creative', name: 'Creative', description: 'Bold and artistic' },
  { id: 'bold', name: 'Bold', description: 'High contrast' },
];

const CATEGORIES = [
  'Lifestyle', 'Fashion', 'Beauty', 'Travel', 'Food', 'Fitness',
  'Tech', 'Gaming', 'Business', 'Education', 'Entertainment', 'Music'
];

function MediaKitEditor({ mediaKit, onUpdate, onFetchStats }) {
  const [activeSection, setActiveSection] = useState('about');
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [newPortfolio, setNewPortfolio] = useState({ title: '', brandName: '', imageUrl: '' });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const handleSectionToggle = (sectionKey, enabled) => {
    onUpdate({
      sections: {
        ...mediaKit.sections,
        [sectionKey]: {
          ...mediaKit.sections[sectionKey],
          enabled
        }
      }
    });
  };

  const handleSectionUpdate = (sectionKey, updates) => {
    onUpdate({
      sections: {
        ...mediaKit.sections,
        [sectionKey]: {
          ...mediaKit.sections[sectionKey],
          ...updates
        }
      }
    });
  };

  const handleCustomizationUpdate = (updates) => {
    onUpdate({
      customization: {
        ...mediaKit.customization,
        ...updates
      }
    });
  };

  const handleAddService = () => {
    if (!newService.name.trim()) return;
    const items = mediaKit.sections.services?.items || [];
    handleSectionUpdate('services', {
      items: [...items, { id: `service-${Date.now()}`, ...newService }]
    });
    setNewService({ name: '', description: '', price: '' });
    setShowServiceForm(false);
  };

  const handleRemoveService = (serviceId) => {
    const items = (mediaKit.sections.services?.items || []).filter(s => s.id !== serviceId);
    handleSectionUpdate('services', { items });
  };

  const handleAddPortfolio = () => {
    if (!newPortfolio.title.trim()) return;
    const items = mediaKit.sections.portfolio?.items || [];
    handleSectionUpdate('portfolio', {
      items: [...items, { id: `portfolio-${Date.now()}`, ...newPortfolio }]
    });
    setNewPortfolio({ title: '', brandName: '', imageUrl: '' });
    setShowPortfolioForm(false);
  };

  const handleRemovePortfolio = (portfolioId) => {
    const items = (mediaKit.sections.portfolio?.items || []).filter(p => p.id !== portfolioId);
    handleSectionUpdate('portfolio', { items });
  };

  const handleCategoryToggle = (category) => {
    const current = mediaKit.sections.about?.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    handleSectionUpdate('about', { categories: updated });
  };

  const sections = [
    { key: 'about', label: 'About', icon: '👤' },
    { key: 'stats', label: 'Stats', icon: '📊' },
    { key: 'services', label: 'Services', icon: '💼' },
    { key: 'portfolio', label: 'Portfolio', icon: '📁' },
    { key: 'contact', label: 'Contact', icon: '📧' },
    { key: 'style', label: 'Style', icon: '🎨' },
  ];

  return (
    <div className="mediakit-editor">
      <div className="editor-tabs">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            className={`editor-tab ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => setActiveSection(section.key)}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="editor-content">
        {activeSection === 'about' && (
          <div className="section-editor">
            <div className="section-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.sections.about?.enabled !== false}
                  onChange={(e) => handleSectionToggle('about', e.target.checked)}
                />
                Show About Section
              </label>
            </div>

            <div className="form-group">
              <label>Headline</label>
              <input
                type="text"
                value={mediaKit.sections.about?.headline || ''}
                onChange={(e) => handleSectionUpdate('about', { headline: e.target.value })}
                placeholder="Content Creator & Lifestyle Influencer"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={mediaKit.sections.about?.bio || ''}
                onChange={(e) => handleSectionUpdate('about', { bio: e.target.value })}
                placeholder="Tell brands about yourself..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={mediaKit.sections.about?.location || ''}
                onChange={(e) => handleSectionUpdate('about', { location: e.target.value })}
                placeholder="Los Angeles, CA"
              />
            </div>

            <div className="form-group">
              <label>Profile Image URL</label>
              <input
                type="text"
                value={mediaKit.sections.about?.profileImage || ''}
                onChange={(e) => handleSectionUpdate('about', { profileImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Categories / Niches</label>
              <div className="category-grid">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip ${mediaKit.sections.about?.categories?.includes(category) ? 'active' : ''}`}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="section-editor">
            <div className="section-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.sections.stats?.enabled !== false}
                  onChange={(e) => handleSectionToggle('stats', e.target.checked)}
                />
                Show Stats Section
              </label>
            </div>

            <StatsDisplay
              stats={mediaKit.sections.stats || { platforms: [] }}
              onUpdateStats={(updates) => handleSectionUpdate('stats', updates)}
              onFetchStats={onFetchStats}
            />
          </div>
        )}

        {activeSection === 'services' && (
          <div className="section-editor">
            <div className="section-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.sections.services?.enabled !== false}
                  onChange={(e) => handleSectionToggle('services', e.target.checked)}
                />
                Show Services Section
              </label>
            </div>

            <div className="services-list">
              {(mediaKit.sections.services?.items || []).map((service) => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    {service.price && <span className="service-price">{service.price}</span>}
                    <p className="service-desc">{service.description}</p>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveService(service.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {showServiceForm ? (
              <div className="add-form">
                <input
                  type="text"
                  placeholder="Service name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Price (e.g., $500)"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  rows={2}
                />
                <div className="form-buttons">
                  <button type="button" className="primary" onClick={handleAddService}>Add</button>
                  <button type="button" className="ghost" onClick={() => setShowServiceForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="add-btn"
                onClick={() => setShowServiceForm(true)}
              >
                + Add Service
              </button>
            )}
          </div>
        )}

        {activeSection === 'portfolio' && (
          <div className="section-editor">
            <div className="section-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.sections.portfolio?.enabled !== false}
                  onChange={(e) => handleSectionToggle('portfolio', e.target.checked)}
                />
                Show Portfolio Section
              </label>
            </div>

            <div className="portfolio-grid">
              {(mediaKit.sections.portfolio?.items || []).map((item) => (
                <div key={item.id} className="portfolio-item">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="portfolio-image" />
                  )}
                  <div className="portfolio-info">
                    <span className="portfolio-title">{item.title}</span>
                    {item.brandName && <span className="portfolio-brand">{item.brandName}</span>}
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemovePortfolio(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {showPortfolioForm ? (
              <div className="add-form">
                <input
                  type="text"
                  placeholder="Project title"
                  value={newPortfolio.title}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Brand name"
                  value={newPortfolio.brandName}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, brandName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newPortfolio.imageUrl}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, imageUrl: e.target.value })}
                />
                <div className="form-buttons">
                  <button type="button" className="primary" onClick={handleAddPortfolio}>Add</button>
                  <button type="button" className="ghost" onClick={() => setShowPortfolioForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="add-btn"
                onClick={() => setShowPortfolioForm(true)}
              >
                + Add Work
              </button>
            )}
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="section-editor">
            <div className="section-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.sections.contact?.enabled !== false}
                  onChange={(e) => handleSectionToggle('contact', e.target.checked)}
                />
                Show Contact Section
              </label>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={mediaKit.sections.contact?.email || ''}
                onChange={(e) => handleSectionUpdate('contact', { email: e.target.value })}
                placeholder="business@example.com"
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input
                type="text"
                value={mediaKit.sections.contact?.website || ''}
                onChange={(e) => handleSectionUpdate('contact', { website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <h5>Social Links</h5>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                value={mediaKit.sections.contact?.socialLinks?.instagram || ''}
                onChange={(e) => handleSectionUpdate('contact', {
                  socialLinks: { ...mediaKit.sections.contact?.socialLinks, instagram: e.target.value }
                })}
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label>TikTok</label>
              <input
                type="text"
                value={mediaKit.sections.contact?.socialLinks?.tiktok || ''}
                onChange={(e) => handleSectionUpdate('contact', {
                  socialLinks: { ...mediaKit.sections.contact?.socialLinks, tiktok: e.target.value }
                })}
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label>YouTube</label>
              <input
                type="text"
                value={mediaKit.sections.contact?.socialLinks?.youtube || ''}
                onChange={(e) => handleSectionUpdate('contact', {
                  socialLinks: { ...mediaKit.sections.contact?.socialLinks, youtube: e.target.value }
                })}
                placeholder="channel"
              />
            </div>
            <div className="form-group">
              <label>Twitter</label>
              <input
                type="text"
                value={mediaKit.sections.contact?.socialLinks?.twitter || ''}
                onChange={(e) => handleSectionUpdate('contact', {
                  socialLinks: { ...mediaKit.sections.contact?.socialLinks, twitter: e.target.value }
                })}
                placeholder="username"
              />
            </div>
          </div>
        )}

        {activeSection === 'style' && (
          <div className="section-editor">
            <div className="form-group">
              <label>Template</label>
              <div className="template-grid">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-card ${mediaKit.template === template.id ? 'active' : ''}`}
                    onClick={() => onUpdate({ template: template.id })}
                  >
                    <span className="template-name">{template.name}</span>
                    <span className="template-desc">{template.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Primary Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={mediaKit.customization?.primaryColor || '#000000'}
                  onChange={(e) => handleCustomizationUpdate({ primaryColor: e.target.value })}
                />
                <input
                  type="text"
                  value={mediaKit.customization?.primaryColor || '#000000'}
                  onChange={(e) => handleCustomizationUpdate({ primaryColor: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Accent Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={mediaKit.customization?.accentColor || '#b29674'}
                  onChange={(e) => handleCustomizationUpdate({ accentColor: e.target.value })}
                />
                <input
                  type="text"
                  value={mediaKit.customization?.accentColor || '#b29674'}
                  onChange={(e) => handleCustomizationUpdate({ accentColor: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Background Color</label>
              <div className="color-input">
                <input
                  type="color"
                  value={mediaKit.customization?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleCustomizationUpdate({ backgroundColor: e.target.value })}
                />
                <input
                  type="text"
                  value={mediaKit.customization?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleCustomizationUpdate({ backgroundColor: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Font</label>
              <select
                value={mediaKit.customization?.fontFamily || 'Inter'}
                onChange={(e) => handleCustomizationUpdate({ fontFamily: e.target.value })}
              >
                <option value="Inter">Inter</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Poppins">Poppins</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={mediaKit.customization?.showRates || false}
                  onChange={(e) => handleCustomizationUpdate({ showRates: e.target.checked })}
                />
                Show service rates/prices
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MediaKitEditor.propTypes = {
  mediaKit: PropTypes.shape({
    name: PropTypes.string,
    template: PropTypes.string,
    sections: PropTypes.object,
    customization: PropTypes.object
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onFetchStats: PropTypes.func.isRequired
};

export default MediaKitEditor;
