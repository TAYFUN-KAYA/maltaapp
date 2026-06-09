import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminI18nProvider } from './i18n';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Schools } from './pages/Schools';
import { Tours } from './pages/Tours';
import { Bookings } from './pages/Bookings';
import { Applications } from './pages/Applications';
import { Inquiries } from './pages/Inquiries';
import { CustomTours } from './pages/CustomTours';
import { Beaches } from './pages/Beaches';
import { Articles } from './pages/Articles';
import { EventsAdmin } from './pages/EventsAdmin';
import { Discounts } from './pages/Discounts';
import { Insights } from './pages/Insights';
import { AppConfigPage } from './pages/AppConfigPage';
import { Emergency } from './pages/Emergency';
import { Commissions } from './pages/Commissions';
import { Rooms } from './pages/Rooms';
import { LanguageTest } from './pages/LanguageTest';
import { Notifications } from './pages/Notifications';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="schools" element={<Schools />} />
        <Route path="tours" element={<Tours />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="applications" element={<Applications />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="custom-tours" element={<CustomTours />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="beaches" element={<Beaches />} />
        <Route path="articles" element={<Articles />} />
        <Route path="events" element={<EventsAdmin />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="insights" element={<Insights />} />
        <Route path="app-config" element={<AppConfigPage />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="commissions" element={<Commissions />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="language-test" element={<LanguageTest />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminI18nProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AdminI18nProvider>
    </BrowserRouter>
  );
}
