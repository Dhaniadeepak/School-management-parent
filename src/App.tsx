import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from './app/hooks';
import Layout from './components/Layout';
import AttendancePage from './pages/AttendancePage';
import FeesPage from './pages/FeesPage';
import HomePage from './pages/HomePage';
import HomeworkPage from './pages/HomeworkPage';
import LoginPage from './pages/LoginPage';
import NoticesPage from './pages/NoticesPage';

function RequireParent({ children }: { children: ReactElement }) {
  const ok = useAppSelector((s) => !!s.auth.accessToken && s.auth.user?.role === 'parent');
  return ok ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireParent>
            <Layout />
          </RequireParent>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="notices" element={<NoticesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
