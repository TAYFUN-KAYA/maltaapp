import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { getAdminSocket } from '../lib/socket';
import { subscribeNotificationCount } from '../lib/notificationCount';
import { useAdminT } from '../i18n';

export function NotificationBell() {
  const { t } = useAdminT();
  const location = useLocation();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    api<{ count: number }>('/admin/notifications/unread-count')
      .then((r) => setCount(r.count))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    return subscribeNotificationCount(refresh);
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  useEffect(() => {
    refresh();
    let socket: Awaited<ReturnType<typeof getAdminSocket>> | null = null;
    const onNotif = () => refresh();

    (async () => {
      try {
        socket = await getAdminSocket();
        socket.emit('join_admins');
        socket.on('admin_notification', onNotif);
      } catch {
        /* offline */
      }
    })();

    const interval = setInterval(refresh, 60000);
    return () => {
      clearInterval(interval);
      socket?.off('admin_notification', onNotif);
    };
  }, [refresh]);

  return (
    <Link
      to="/notifications"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        padding: '8px 12px',
        borderRadius: 8,
        background: '#fff',
        color: '#0a6e8a',
        fontWeight: 700,
        textDecoration: 'none',
        border: '1px solid #e8edf2',
      }}
    >
      🔔 {t('notifications.title')}
      {count > 0 && (
        <span
          style={{
            background: '#e74c3c',
            color: '#fff',
            borderRadius: 10,
            padding: '2px 8px',
            fontSize: 12,
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
