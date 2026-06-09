import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { ImageUpload } from '../components/ImageUpload';
import { LocalizedFields } from '../components/LocalizedFields';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

interface Beach {
  _id: string;
  name: string;
  island: string;
  crowdLevel: string;
  description?: string;
  images?: string[];
}

export function Beaches() {
  const [items, setItems] = useState<Beach[]>([]);
  const [form, setForm] = useState<Partial<Beach>>({ name: '', island: 'malta', crowdLevel: 'medium' });
  const [descriptionI18n, setDescriptionI18n] = useState<I18nRecord>(emptyI18n);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ beaches: Beach[] }>('/admin/beaches').then((r) => setItems(r.beaches));
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const body = {
      ...form,
      description: descriptionI18n.tr || form.description || '',
      descriptionI18n,
      images: form.images || [],
    };
    if (editId) await api(`/admin/beaches/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/beaches', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu plajı silmek istediğinize emin misiniz?')) return;
    await api(`/admin/beaches/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Plajlar ({items.length})</h1>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          setEditId(null);
          setForm({ name: '', island: 'malta', crowdLevel: 'medium' });
          setDescriptionI18n(emptyI18n());
          setOpen(true);
        }}
      >
        + Yeni Plaj
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Ad</th><th>Ada</th><th>Kalabalık</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id}>
                <td><strong>{b.name}</strong></td>
                <td>{b.island}</td>
                <td>{b.crowdLevel}</td>
                <td>
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() => {
                      setEditId(b._id);
                      setForm(b);
                      setDescriptionI18n(i18nFromDoc(b as Record<string, unknown>, 'description'));
                      setOpen(true);
                    }}
                  >
                    Düzenle
                  </button>
                  <button type="button" className="btn-sm" style={{ marginLeft: 8 }} onClick={() => remove(b._id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title="Plaj" onClose={() => setOpen(false)} wide>
        <div className="form-grid">
          <div><label>Ad</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Ada</label><input value={form.island || ''} onChange={(e) => setForm({ ...form, island: e.target.value })} /></div>
          <div><label>Kalabalık</label><input value={form.crowdLevel || ''} onChange={(e) => setForm({ ...form, crowdLevel: e.target.value })} /></div>
          <LocalizedFields
            label="Açıklama (çok dilli)"
            value={descriptionI18n}
            onChange={setDescriptionI18n}
            multiline
            rows={4}
          />
          <ImageUpload
            label="Görseller"
            value={form.images || []}
            onChange={(images) => setForm({ ...form, images })}
            multiple
            showUrlInput={false}
          />
        </div>
        <div className="modal-actions"><button type="button" className="btn-sm" onClick={save}>Kaydet</button></div>
      </SimpleModal>
    </div>
  );
}
