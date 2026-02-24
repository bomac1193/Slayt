import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import ProfileSwitcher from '../profile/ProfileSwitcher';
import {
  LayoutGrid,
  FolderOpen,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Youtube,
  Layers,
  Users,
  UserCircle2,
  CalendarDays as CalendarIcon,
  TrendingUp,
  Ellipsis,
  PenLine,
  LayoutTemplate,
  SlidersHorizontal,
} from 'lucide-react';

const navSections = [
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { path: '/grid', icon: LayoutGrid, label: 'Grid' },
      { path: '/youtube', icon: Youtube, label: 'YouTube' },
      { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
      { path: '/rollout', icon: Layers, label: 'Rollout' },
    ],
  },
  {
    id: 'create',
    label: 'Create',
    items: [
      { path: '/editor', icon: PenLine, label: 'Editor' },
      { path: '/library', icon: FolderOpen, label: 'Library' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
      {
        id: 'more',
        icon: Ellipsis,
        label: 'More',
        children: [
          { path: '/editor/pro', icon: SlidersHorizontal, label: 'Editor Pro' },
          { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
          { path: '/learning', icon: TrendingUp, label: 'Learning' },
          { path: '/studio', icon: FolderOpen, label: 'Folio' },
          { path: '/characters', icon: UserCircle2, label: 'Boveda' },
          { path: '/profiles', icon: Users, label: 'Profiles' },
          { path: '/connections', icon: Link2, label: 'Connections' },
        ],
      },
    ],
  },
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

  const Icon = item.icon;

  // Simple nav item (no children)
  if (!item.children) {
    return (
      <li>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `h-9 flex items-center ${Icon ? 'gap-2' : ''} px-2.5 border-l-2 transition-colors ${
              isActive
                ? 'border-accent-purple text-dark-100 bg-dark-700/40'
                : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/20'
            } ${collapsed ? 'justify-center' : ''} ${!Icon && !collapsed ? 'pl-3.5' : ''}`
          }
          title={collapsed ? item.label : undefined}
        >
          {Icon ? <Icon className="w-4 h-4 flex-shrink-0" /> : null}
          {!collapsed && (
            <span className="text-sm">{item.label}</span>
          )}
        </NavLink>
      </li>
    );
  }

  // Grouped nav item with children
  return (
    <li>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full h-9 flex items-center gap-2 px-2.5 border-l-2 transition-colors ${
          isActive
            ? 'border-accent-purple text-dark-100 bg-dark-700/40'
            : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/20'
        } ${collapsed ? 'justify-center' : ''} ${!Icon && !collapsed ? 'pl-3.5' : ''}`}
        title={collapsed ? item.label : undefined}
        type="button"
      >
        {Icon ? <Icon className="w-4 h-4 flex-shrink-0" /> : null}
        {!collapsed && (
          <>
            <span className="text-sm flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Child items */}
      {!collapsed && isOpen && (
        <ul className="mt-1 ml-3 pl-3 border-l border-dark-700 space-y-0.5">
          {item.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                className={({ isActive }) =>
                  `h-8 flex items-center ${child.icon ? 'gap-2' : ''} px-2.5 border-l-2 transition-colors text-sm ${
                    isActive
                      ? 'border-accent-purple text-dark-100 bg-dark-700/30'
                      : 'border-transparent text-dark-500 hover:text-dark-200 hover:bg-dark-700/20'
                  } ${!child.icon ? 'pl-3.5' : ''}`
                }
              >
                {child.icon ? <child.icon className="w-3.5 h-3.5" /> : null}
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
      className={`fixed left-0 top-0 h-full bg-dark-800 border-r border-dark-700 flex flex-col transition-all duration-300 z-[60] ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-dark-700">
        {!sidebarCollapsed && (
          <div className="flex items-center">
            <span className="font-display font-semibold text-[1.15rem] leading-none text-white tracking-[0.03em]">
              Atelio
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mx-auto">
            <span className="font-display font-semibold text-xs leading-none text-white tracking-[0.04em]">
              Atelio
            </span>
          </div>
        )}
      </div>

      {/* Profile Switcher */}
      <ProfileSwitcher collapsed={sidebarCollapsed} />

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.id}>
              {!sidebarCollapsed && (
                <div className="px-2 pb-1">
                  <span className="micro-label text-dark-500">{section.label}</span>
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.path || item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-dark-700">
        <button
          onClick={toggleSidebar}
          className="w-full h-9 flex items-center justify-center gap-2 px-3 text-dark-400 hover:bg-dark-700/30 hover:text-dark-200 transition-colors"
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
