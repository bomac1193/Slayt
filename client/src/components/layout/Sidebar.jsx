import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import ProfileSwitcher from '../profile/ProfileSwitcher';
import {
  LayoutGrid,
  Image,
  Wand2,
  FolderOpen,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Youtube,
  Layers,
  Users,
  Crosshair,
  ScanLine,
  Radio,
  UserCircle2,
  PenTool,
  CalendarDays as CalendarIcon,
  Clock,
} from 'lucide-react';

// Λ — Lambda mark. Taste as function, mapping signals to archetype.
// Apex offset left — not a perfect isosceles. Designed, not generated.
function LambdaLogo({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 22L10.5 3L20 22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Navigation items with optional children for grouped items
const navItems = [
  { path: '/grid', icon: LayoutGrid, label: 'Grid Planner' },
  { path: '/youtube', icon: Youtube, label: 'YouTube Planner' },
  {
    id: 'scheduler',
    icon: Clock,
    label: 'Scheduler',
    children: [
      { path: '/rollout', icon: Layers, label: 'Rollout' },
      { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    ],
  },
  {
    id: 'editor',
    icon: PenTool,
    label: 'Editor',
    children: [
      { path: '/editor', icon: Image, label: 'Quick' },
      { path: '/editor/pro', icon: Wand2, label: 'Pro' },
    ],
  },
  {
    id: 'subtaste',
    icon: ScanLine,
    label: 'Subtaste',
    children: [
      { path: '/genome', icon: Crosshair, label: 'Genome' },
      { path: '/training', icon: Radio, label: 'Training' },
      { path: '/studio', icon: FolderOpen, label: 'Folio' },
    ],
  },
  { path: '/characters', icon: UserCircle2, label: 'Boveda' },
  { path: '/library', icon: FolderOpen, label: 'Gallery' },
  { path: '/profiles', icon: Users, label: 'Profiles' },
  { path: '/connections', icon: Link2, label: 'Connections' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if any child is active
    if (item.children) {
      return item.children.some(child => location.pathname === child.path);
    }
    return false;
  });

  // Check if this item or any child is active
  const isActive = item.children
    ? item.children.some(child => location.pathname === child.path)
    : location.pathname === item.path;

  // Simple nav item (no children)
  if (!item.children) {
    return (
      <li>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? item.label : undefined}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </NavLink>
      </li>
    );
  }

  // Grouped nav item with children
  return (
    <li>
      <button
        onClick={() => !collapsed && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          isActive
            ? 'bg-accent-purple/20 text-accent-purple'
            : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
        } ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Child items */}
      {!collapsed && isOpen && (
        <ul className="mt-1 ml-4 pl-4 border-l border-dark-700 space-y-1">
          {item.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-accent-purple/10 text-accent-purple'
                      : 'text-dark-400 hover:bg-dark-700 hover:text-dark-200'
                  }`
                }
              >
                <child.icon className="w-4 h-4" />
                <span>{child.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-dark-800 border-r border-dark-700 flex flex-col transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm border border-dark-600 bg-dark-900 flex items-center justify-center">
              <LambdaLogo className="w-5 h-5 text-dark-100" />
            </div>
            <span className="font-display font-semibold text-lg text-white uppercase tracking-widest">
              Slayt
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-9 h-9 rounded-sm border border-dark-600 bg-dark-900 flex items-center justify-center mx-auto group cursor-pointer">
            <LambdaLogo className="w-5 h-5 text-dark-100 transition-transform group-hover:rotate-12" />
          </div>
        )}
      </div>

      {/* Profile Switcher */}
      <ProfileSwitcher collapsed={sidebarCollapsed} />

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <NavItem
              key={item.path || item.id}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-dark-700">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-dark-400 hover:bg-dark-700 hover:text-dark-200 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
