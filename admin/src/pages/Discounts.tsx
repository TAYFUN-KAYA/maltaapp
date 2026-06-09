import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';

interface Code {
  _id: string;
  code: string;
  percent?: number;
  active: boolean;
  forTurkish?: boolean;
}

export function Discounts() {
  const [items, setItems] = useState<Code[]>([]);
  const [form, setForm] = useState({ code: '', percent: 10, active: true, forTurkish: false });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ codes: Code[] }>('/admin/discount-codes').then((r) => setItems(r.codes));
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ code: '', percent: 10, active: true, forTurkish: false });
    setOpen(true);
  };

  const openEdit = (c: Code) => {
    setEditId(c._id);
    setForm({ code: c.code, percent: c.percent || 10, active: c.active, forTurkish: !!c.forTurkish });
    setOpen(true);
  };

  const save = async () => {
    if (editId) await api(`/admin/discount-codes/${editId}`, { method: 'PATCH', body: JSON.stringify(form) });
    else await api('/admin/discount-codes', { method: 'POST', body: JSON.stringify(form) });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Kod silinsin mi?')) return;
    await api(`/admin/discount-codes/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">İndirim Kodları</h1>
      <button type="button" className="btn-secondary" onClick={openNew}>+ Kod</button>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Kod</th><th>%</th><th>Aktif</th><th>TR</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td>{c.code}</td>
                <td>{c.percent}%</td>
                <td>{c.active ? 'Evet' : 'Hayır'}</td>
                <td>{c.forTurkish ? 'Evet' : '—'}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEdit(c)}>Düzenle</button>
                  <button type="button" className="btn-sm" onClick={() => remove(c._id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title={editId ? 'Kod düzenle' : 'Yeni kod'} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <div><label>Kod</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
          <div><label>Yüzde</label><input type="number" value={form.percent} onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })} /></div>
          <label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktif</label>
          <label><input type="checkbox" checked={form.forTurkish} onChange={(e) => setForm({ ...form, forTurkish: e.target.checked })} /> Türk kullanıcılar için</label>
        </div>
        <div className="modal-actions"><button type="button" className="btn-sm" onClick={save}>Kaydet</button></div>
      </SimpleModal>
    </div>
  );
}
