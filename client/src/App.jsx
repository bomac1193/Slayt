import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { authApi } from './lib/api';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import GridPlanner from './pages/GridPlanner';
import YouTubePlanner from './pages/YouTubePlanner';
import RolloutPlanner from './pages/RolloutPlanner';
import QuickEditor from './pages/QuickEditor';
import ProEditor from './pages/ProEditor';
import Calendar from './pages/Calendar';
import MediaLibrary from './pages/MediaLibrary';
import Connections from './pages/Connections';
import Profiles from './pages/Profiles';
import Settings from './pages/Settings';
import Characters from './pages/Characters';
import ContentStudio from './pages/ContentStudio';
import FolioCollections from './pages/FolioCollections';
import TemplateLibrary from './pages/TemplateLibrary';
import LearningDashboard from './pages/LearningDashboard';

// ── Λ Splash ────────────────────────────────────────────────────────────────
function Splash({ fadingOut }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-dark-900 flex flex-col items-center justify-center transition-opacity duration-500"
      style={{ opacity: fadingOut ? 0 : 1 }}
    >
      <div className="mb-6">
        <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-dark-100" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 22L10.5 3L20 22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-dark-100 uppercase tracking-[0.3em]">
        Atelio
      </h1>
      <p className="text-dark-500 text-xs font-mono uppercase tracking-[0.2em] mt-2">
        Λ8 Initializing
      </p>
    </div>
  );
}

function App() {
  const theme = useAppStore((state) => state.theme);
  const setUser = useAppStore((state) => state.setUser);
  const [appReady, setAppReady] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auth check + splash
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authApi.getMe();
          if (!cancelled) setUser(data.user || data);
        } catch {
          // Token invalid — clear it, user will land on login
          localStorage.removeItem('token');
        }
      }
      // Minimum splash duration so it doesn't flash
      await new Promise((r) => setTimeout(r, 800));
      if (!cancelled) {
        setFadingOut(true);
        // Let the fade-out transition finish before unmounting
        setTimeout(() => { if (!cancelled) setAppReady(true); }, 500);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [setUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useAppStore.getState().undo?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useAppStore.getState().redo?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!appReady) {
    return <Splash fadingOut={fadingOut} />;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/grid" replace />} />
          <Route path="grid" element={<GridPlanner />} />
          <Route path="youtube" element={<YouTubePlanner />} />
          <Route path="rollout" element={<RolloutPlanner />} />
          <Route path="editor" element={<QuickEditor />} />
          <Route path="editor/pro" element={<ProEditor />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="library" element={<MediaLibrary />} />
          <Route path="connections" element={<Connections />} />
          <Route path="profiles" element={<Profiles />} />
          <Route path="characters" element={<Characters />} />
          <Route path="studio" element={<ContentStudio />} />
          <Route path="collections" element={<FolioCollections />} />
          <Route path="templates" element={<TemplateLibrary />} />
          <Route path="learning" element={<LearningDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
