import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  User,
  Bell,
  Palette,
  Clock,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Save,
  Key,
  Globe,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'scheduling', label: 'Scheduling', icon: Clock },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data & Export', icon: Download },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

function Settings() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const user = useAppStore((state) => state.user);

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    timezone: 'America/New_York',
    defaultPostTime: '09:00',
    autoSaveDrafts: true,
    notifications: {
      email: true,
      push: true,
      postReminders: true,
      weeklyReport: false,
    },
  });

  const handleSave = () => {
    console.log('Saving settings:', formData);
    // In production, this would call the API
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-dark-100 mb-2">
          Settings
        </h1>
        <p className="text-dark-400">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-purple/20 text-accent-purple'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-dark-800 rounded-2xl border border-dark-700 p-6">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Profile Settings</h2>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <button className="btn-secondary text-sm">Change Avatar</button>
                  <p className="text-xs text-dark-500 mt-1">JPG, PNG. Max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Appearance</h2>

              <div>
                <label className="input-label mb-3">Theme</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-accent-purple bg-dark-700'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <Moon className="w-6 h-6 text-dark-200 mx-auto mb-2" />
                    <p className="text-sm text-dark-200">Dark</p>
                  </button>
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`flex-1 p-4 rounded-xl border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-accent-purple bg-dark-700'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <Sun className="w-6 h-6 text-dark-200 mx-auto mb-2" />
                    <p className="text-sm text-dark-200">Light</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="input-label">Accent Color</label>
                <div className="flex gap-2 mt-2">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white/50"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Notifications</h2>

              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                  { key: 'postReminders', label: 'Post Reminders', desc: 'Reminders before scheduled posts' },
                  { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Weekly performance summary' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-dark-200">{item.label}</p>
                      <p className="text-sm text-dark-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [item.key]: !formData.notifications[item.key],
                          },
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors ${
                        formData.notifications[item.key] ? 'bg-accent-purple' : 'bg-dark-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          formData.notifications[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling */}
          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Scheduling Preferences</h2>

              <div>
                <label className="input-label">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="input"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Default Post Time</label>
                <input
                  type="time"
                  value={formData.defaultPostTime}
                  onChange={(e) => setFormData({ ...formData, defaultPostTime: e.target.value })}
                  className="input"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-200">Auto-save Drafts</p>
                  <p className="text-sm text-dark-500">Automatically save your work</p>
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, autoSaveDrafts: !formData.autoSaveDrafts })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.autoSaveDrafts ? 'bg-accent-purple' : 'bg-dark-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.autoSaveDrafts ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Security</h2>

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-dark-400" />
                    <div className="text-left">
                      <p className="text-dark-200">Change Password</p>
                      <p className="text-sm text-dark-500">Update your password</p>
                    </div>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-dark-400" />
                    <div className="text-left">
                      <p className="text-dark-200">Two-Factor Authentication</p>
                      <p className="text-sm text-dark-500">Add extra security to your account</p>
                    </div>
                  </div>
                  <span className="badge badge-orange">Off</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-dark-400" />
                    <div className="text-left">
                      <p className="text-dark-200">Active Sessions</p>
                      <p className="text-sm text-dark-500">Manage your logged-in devices</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Data & Export */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-dark-100">Data & Export</h2>

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-dark-400" />
                    <div className="text-left">
                      <p className="text-dark-200">Export All Data</p>
                      <p className="text-sm text-dark-500">Download all your content and settings</p>
                    </div>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-red-900/20 rounded-lg hover:bg-red-900/30 transition-colors border border-red-900/50">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div className="text-left">
                      <p className="text-red-400">Delete Account</p>
                      <p className="text-sm text-red-400/70">Permanently delete your account and data</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-dark-700 flex justify-end">
            <button onClick={handleSave} className="btn-primary">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
