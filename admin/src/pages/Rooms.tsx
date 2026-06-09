import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { useAdminT } from '../i18n';

interface Room {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  type: string;
  memberCount: number;
  isPublic: boolean;
}

interface RoomMember {
  _id: string;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  joinedAt: string;
}

const empty = {
  name: '',
  slug: '',
  description: '',
  type: 'topic',
  isPublic: true,
};

export function Rooms() {
  const { t } = useAdminT();
  const [items, setItems] = useState<Room[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [membersRoom, setMembersRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const load = () => api<{ rooms: Room[] }>('/admin/rooms').then((r) => setItems(r.rooms));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (r: Room) => {
    setEditId(r._id);
    setForm({
      name: r.name,
      slug: r.slug || '',
      description: r.description || '',
      type: r.type,
      isPublic: r.isPublic !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const body = {
      ...form,
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
    };
    if (editId) await api(`/admin/rooms/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/rooms', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  const removeRoom = async (id: string) => {
    if (!confirm(t('rooms.deleteConfirm'))) return;
    await api(`/admin/rooms/${id}`, { method: 'DELETE' });
    load();
  };

  const openMembers = async (room: Room) => {
    setMembersRoom(room);
    setMembersLoading(true);
    try {
      const res = await api<{ members: RoomMember[]; memberCount: number }>(`/admin/rooms/${room._id}/members`);
      setMembers(res.members);
      setItems((prev) => prev.map((r) => (r._id === room._id ? { ...r, memberCount: res.memberCount } : r)));
    } finally {
      setMembersLoading(false);
    }
  };

  const kickMember = async (userId: string) => {
    if (!membersRoom || !confirm(t('rooms.kickConfirm'))) return;
    const res = await api<{ memberCount: number }>(`/admin/rooms/${membersRoom._id}/members/${userId}`, {
      method: 'DELETE',
    });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setItems((prev) =>
      prev.map((r) => (r._id === membersRoom._id ? { ...r, memberCount: res.memberCount } : r))
    );
    setMembersRoom((prev) => (prev ? { ...prev, memberCount: res.memberCount } : prev));
  };

  return (
    <div>
      <h1 className="page-title">
        {t('rooms.title')} ({items.length})
      </h1>
      <button type="button" className="btn-secondary" onClick={openCreate}>
        + {t('rooms.newRoom')}
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('rooms.name')}</th>
              <th>{t('rooms.slug')}</th>
              <th>{t('rooms.type')}</th>
              <th>{t('rooms.memberCount')}</th>
              <th>{t('rooms.public')}</th>
              <th>{t('rooms.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.name}</strong>
                  {r.description && (
                    <>
                      <br />
                      <small>{r.description.slice(0, 60)}</small>
                    </>
                  )}
                </td>
                <td>{r.slug || '—'}</td>
                <td>{r.type}</td>
                <td>{r.memberCount}</td>
                <td>{r.isPublic !== false ? '✓' : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn-sm" onClick={() => openMembers(r)}>
                    {t('rooms.manageMembers')}
                  </button>
                  <button type="button" className="btn-sm" onClick={() => openEdit(r)}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn-sm" onClick={() => removeRoom(r._id)}>
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimpleModal open={open} title={editId ? t('rooms.editRoom') : t('rooms.newRoom')} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <div>
            <label>{t('rooms.name')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label>{t('rooms.slug')}</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ornek-oda" />
          </div>
          <div>
            <label>{t('rooms.type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="topic">topic</option>
              <option value="country">country</option>
              <option value="language_exchange">language_exchange</option>
              <option value="event">event</option>
            </select>
          </div>
          <div>
            <label>{t('rooms.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />{' '}
              {t('rooms.public')}
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-sm" onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </SimpleModal>

      <SimpleModal
        open={!!membersRoom}
        title={membersRoom ? `${t('rooms.members')}: ${membersRoom.name}` : t('rooms.members')}
        onClose={() => setMembersRoom(null)}
        wide
      >
        {membersLoading ? (
          <p>{t('common.loading')}</p>
        ) : members.length === 0 ? (
          <p style={{ color: '#6b7c8f' }}>{t('rooms.noMembers')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('rooms.name')}</th>
                  <th>{t('rooms.email')}</th>
                  <th>{t('rooms.joinedAt')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id}>
                    <td>{m.name || '—'}</td>
                    <td>{m.email || '—'}</td>
                    <td>{new Date(m.joinedAt).toLocaleString()}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => kickMember(m.userId)}>
                        {t('rooms.kick')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
