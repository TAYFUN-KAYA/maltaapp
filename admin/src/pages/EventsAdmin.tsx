import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { ImageUpload } from '../components/ImageUpload';

interface Event {
  _id: string;
  title: string;
  date: string;
  location?: string;
  type: string;
  maxAttendees?: number;
  active?: boolean;
  image?: string;
}

export function EventsAdmin() {
  const [items, setItems] = useState<Event[]>([]);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    type: 'meetup',
    maxAttendees: 20,
    image: '' as string,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ events: Event[] }>('/admin/events').then((r) => setItems(r.events));
  useEffect(() => { load(); }, []);

  const save = async () => {
    const body = { ...form, date: new Date(form.date).toISOString(), active: true };
    if (editId) await api(`/admin/events/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/events', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  return (
    <div>
      <h1 className="page-title">Etkinlikler</h1>
      <button type="button" className="btn-secondary" onClick={() => { setEditId(null); setForm({ title: '', date: '', location: '', type: 'meetup', maxAttendees: 20, image: '' }); setOpen(true); }}>+ Etkinlik</button>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Başlık</th><th>Tarih</th><th>Konum</th><th></th></tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e._id}>
                <td>{e.title}</td>
                <td>{new Date(e.date).toLocaleString()}</td>
                <td>{e.location}</td>
                <td><button type="button" className="btn-sm" onClick={() => { setEditId(e._id); setForm({ title: e.title, date: e.date.slice(0, 16), location: e.location || '', type: e.type, maxAttendees: e.maxAttendees || 20, image: e.image || '' }); setOpen(true); }}>Düzenle</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title="Etkinlik" onClose={() => setOpen(false)}>
        <div className="form-grid">
          <div><label>Başlık</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label>Tarih</label><input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label>Konum</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><label>Tip</label><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
          <ImageUpload
            label="Kapak görseli"
            value={form.image ? [form.image] : []}
            onChange={(urls) => setForm({ ...form, image: urls[0] || '' })}
            showUrlInput={false}
          />
        </div>
        <div className="modal-actions"><button type="button" className="btn-sm" onClick={save}>Kaydet</button></div>
      </SimpleModal>
    </div>
  );
}
