import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { useLogoutMutation, useNotificationsQuery } from '../api/parentApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loggedOut } from '../features/auth/authSlice';
import { childSelected } from '../features/child/childSlice';
import { useChild } from '../lib/useChild';
import { Alert, Empty, Spinner } from './ui';
import { errorMessage } from '../lib/utils';

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { child, children, isLoading, error } = useChild();
  const { data: notes } = useNotificationsQuery(undefined, { pollingInterval: 60_000 });
  const [logout] = useLogoutMutation();

  const signOut = async () => {
    if (!confirm('Sign out of the parent app?')) return;
    await logout().unwrap().catch(() => null);
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
  };

  const tabs = [
    { to: '/', icon: '🏠', label: 'Home', count: notes?.unreadCount },
    { to: '/attendance', icon: '📅', label: 'Attendance' },
    { to: '/homework', icon: '📚', label: 'Homework' },
    { to: '/fees', icon: '💳', label: 'Fees' },
    { to: '/notices', icon: '📣', label: 'Notices' },
  ];

  return (
    <div className="mobile-shell">
      <header className="mobile-top">
        <h1>{user?.schoolName ?? 'School'}</h1>
        {children.length > 1 ? (
          <select aria-label="Choose child" value={child?.id ?? ''} onChange={(e) => dispatch(childSelected(e.target.value))}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.split(' ')[0]} ({c.className})
              </option>
            ))}
          </select>
        ) : child ? (
          <span className="small">
            {child.name} · {child.className}
          </span>
        ) : null}
        <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={signOut} aria-label="Sign out">
          ⎋
        </button>
      </header>
      <div className="mobile-content">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <Alert>{errorMessage(error)}</Alert>
        ) : !child ? (
          <Empty>No children are linked to this phone number. Please contact the school office.</Empty>
        ) : (
          <Outlet />
        )}
      </div>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon">{t.icon}</span>
              {t.label}
              {t.count ? <span className="dot">{t.count}</span> : null}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
