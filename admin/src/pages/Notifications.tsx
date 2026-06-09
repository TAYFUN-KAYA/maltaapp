import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { bumpNotificationCount } from '../lib/notificationCount';
import { useAdminT } from '../i18n';

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: { requestId?: string };
}

export function Notifications() {
  const { t } = useAdminT();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<{ notifications: Notification[] }>('/admin/notifications')
      .then((r) => setItems(r.notifications))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    await api(`/admin/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    bumpNotificationCount();
  };

  const open = (n: Notification) => {
    markRead(n._id);
    if (n.data?.requestId) {
      navigate(`/custom-tours?chat=${n.data.requestId}`);
    }
  };

  const markAllRead = async () => {
    await api('/admin/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    bumpNotificationCount();
  };

  if (loading) return <p>{t('common.loading')}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('notifications.title')}
        </h1>
        {items.some((n) => !n.read) && (
          <button type="button" className="btn-sm" onClick={markAllRead}>
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p style={{ color: '#6b7c8f' }}>{t('notifications.empty')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('notifications.colTitle')}</th>
                <th>{t('notifications.colBody')}</th>
                <th>{t('notifications.colDate')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr
                  key={n._id}
                  style={{ cursor: n.data?.requestId ? 'pointer' : 'default', fontWeight: n.read ? 400 : 700 }}
                  onClick={() => n.data?.requestId && open(n)}
                >
                  <td>{n.title}</td>
                  <td>{n.body}</td>
                  <td>{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
