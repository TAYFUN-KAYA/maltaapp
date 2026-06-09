import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminT, type AdminLang } from '../i18n';
import { NotificationBell } from './NotificationBell';
import './Layout.css';

export function Layout() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useAdminT();

  const nav = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/schools', label: t('nav.schools') },
    { to: '/tours', label: t('nav.tours') },
    { to: '/beaches', label: t('nav.beaches') },
    { to: '/articles', label: t('nav.articles') },
    { to: '/events', label: t('nav.events') },
    { to: '/insights', label: t('nav.insights') },
    { to: '/discounts', label: t('nav.discounts') },
    { to: '/emergency', label: t('nav.emergency') },
    { to: '/app-config', label: t('nav.appConfig') },
    { to: '/bookings', label: t('nav.bookings') },
    { to: '/applications', label: t('nav.applications') },
    { to: '/inquiries', label: t('nav.inquiries') },
    { to: '/custom-tours', label: t('nav.customTours') },
    { to: '/notifications', label: t('nav.notifications') },
    { to: '/commissions', label: t('nav.commissions') },
    { to: '/rooms', label: t('nav.rooms') },
    { to: '/language-test', label: t('nav.languageTest') },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🌊</span>
          <div>
            <strong>MaltaStart</strong>
            <small>{t('common.adminPanel')}</small>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as AdminLang)}
            style={{ marginBottom: 8, width: '100%' }}
            aria-label="Language"
          >
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
          <span>{user?.email}</span>
          <button type="button" onClick={logout}>
            {t('common.logout')}
          </button>
        </div>
      </aside>
      <main className="main">
        <NotificationBell />
        <Outlet />
      </main>
    </div>
  );
}
