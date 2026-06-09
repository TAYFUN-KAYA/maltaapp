import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { ImageUpload } from '../components/ImageUpload';
import { LocalizedFields } from '../components/LocalizedFields';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

interface School {
  _id: string;
  name: string;
  city: string;
  priceFrom: number;
  rating: number;
  featured: boolean;
  active: boolean;
  description?: string;
  descriptionI18n?: I18nRecord;
  videoUrl?: string;
  accreditations?: string[];
  images?: string[];
}

const empty: Partial<School> = {
  name: '',
  city: 'st_julians',
  priceFrom: 150,
  description: '',
  featured: false,
  active: true,
};

const CITY_OPTIONS = [
  { value: 'st_julians', label: "St. Julian's" },
  { value: 'sliema', label: 'Sliema' },
  { value: 'valletta', label: 'Valletta' },
  { value: 'gzira', label: 'Gzira' },
  { value: 'msida', label: 'Msida' },
  { value: 'swieqi', label: 'Swieqi' },
  { value: 'san_gwann', label: 'San Gwann' },
  { value: 'st_pauls', label: "St. Paul's Bay" },
  { value: 'other', label: 'Diğer' },
];

export function Schools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState<Partial<School>>(empty);
  const [descriptionI18n, setDescriptionI18n] = useState<I18nRecord>(emptyI18n);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ schools: School[] }>('/admin/schools?all=true').then((r) => setSchools(r.schools));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm(empty);
    setDescriptionI18n(emptyI18n());
    setOpen(true);
  };

  const openEdit = (s: School) => {
    setEditId(s._id);
    setForm(s);
    setDescriptionI18n(i18nFromDoc(s as Record<string, unknown>, 'description'));
    setOpen(true);
  };

  const save = async () => {
    const body = {
      ...form,
      description: descriptionI18n.tr || form.description || '',
      descriptionI18n,
      accreditations: typeof form.accreditations === 'string' ? (form.accreditations as string).split(',').map((x) => x.trim()) : form.accreditations,
      images: typeof (form as { images?: string | string[] }).images === 'string'
        ? (form as { images: string }).images.split(',').map((x) => x.trim())
        : form.images,
    };
    if (editId) await api(`/admin/schools/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/schools', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Pasife alınsın mı?')) return;
    await api(`/admin/schools/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Okullar ({schools.length})</h1>
      <p style={{ color: '#6b7c8f', marginBottom: 16, maxWidth: 720 }}>
        Turist ve Work &amp; Study keşfet ekranında <strong>öne çıkan</strong> okullar listelenir.
      </p>
      <button type="button" className="btn-secondary" onClick={openNew}>
        + Yeni Okul
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Okul</th>
              <th>Şehir</th>
              <th>Fiyat</th>
              <th>Puan</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s._id}>
                <td>
                  <strong>{s.name}</strong>
                  {s.featured && <span className="badge" style={{ marginLeft: 8 }}>Öne Çıkan</span>}
                </td>
                <td>{CITY_OPTIONS.find((c) => c.value === s.city)?.label || s.city}</td>
                <td>€{s.priceFrom}/hafta</td>
                <td>★ {s.rating?.toFixed(1)}</td>
                <td>
                  <span className={`badge ${s.active ? '' : 'pending'}`}>{s.active ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEdit(s)}>
                    Düzenle
                  </button>
                  <button type="button" className="btn-sm" onClick={() => remove(s._id)}>
                    Pasif
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimpleModal open={open} title={editId ? 'Okul Düzenle' : 'Yeni Okul'} onClose={() => setOpen(false)} wide>
        <div className="form-grid">
          <div>
            <label>Ad</label>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label>Şehir</label>
            <select value={form.city || 'st_julians'} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {CITY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Haftalık fiyat (€)</label>
            <input type="number" value={form.priceFrom || 0} onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) })} />
          </div>
          <LocalizedFields
            label="Açıklama (çok dilli)"
            value={descriptionI18n}
            onChange={setDescriptionI18n}
            multiline
            rows={4}
          />
          <div>
            <label>Video URL</label>
            <input value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          </div>
          <ImageUpload
            label="Görseller"
            value={Array.isArray(form.images) ? form.images : []}
            onChange={(images) => setForm({ ...form, images })}
            multiple
          />
          <div>
            <label>Akreditasyon (virgülle)</label>
            <input
              value={Array.isArray(form.accreditations) ? form.accreditations.join(', ') : ''}
              onChange={(e) => setForm({ ...form, accreditations: e.target.value.split(',').map((x) => x.trim()) })}
            />
          </div>
          <label>
            <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Öne çıkan
          </label>
          <label>
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Aktif
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={save}>
            Kaydet
          </button>
          <button type="button" className="btn-sm" onClick={() => setOpen(false)}>
            İptal
          </button>
        </div>
      </SimpleModal>
    </div>
  );
}
