import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { authApi } from './lib/api';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import GridPlanner from './pages/GridPlanner';
import YouTubePlanner from './pages/YouTubePlanner';
import RolloutPlanner from './pages/RolloutPlanner';

import Calendar from './pages/Calendar';
import MediaLibrary from './pages/MediaLibrary';
import Connections from './pages/Connections';
import Profiles from './pages/Profiles';
import Settings from './pages/Settings';
import ContentStudio from './pages/ContentStudio';
import FolioCollections from './pages/FolioCollections';
import TemplateLibrary from './pages/TemplateLibrary';
import LearningDashboard from './pages/LearningDashboard';

function App() {
  const theme = useAppStore((state) => state.theme);
  const setUser = useAppStore((state) => state.setUser);
  const [appReady, setAppReady] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auth check
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authApi.getMe();
          if (!cancelled) setUser(data.user || data);
        } catch {
          localStorage.removeItem('token');
        }
      }
      if (!cancelled) setAppReady(true);
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
    return <div className="min-h-screen bg-dark-900" />;
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
          <Route path="calendar" element={<Calendar />} />
          <Route path="library" element={<MediaLibrary />} />
          <Route path="connections" element={<Connections />} />
          <Route path="profiles" element={<Profiles />} />
          {/* Folio UI hidden — API integration in PostAIGenerator/RolloutPlanner remains active */}
          {/* <Route path="studio" element={<ContentStudio />} /> */}
          {/* <Route path="collections" element={<FolioCollections />} /> */}
          <Route path="templates" element={<TemplateLibrary />} />
          <Route path="learning" element={<LearningDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
