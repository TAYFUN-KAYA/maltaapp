import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { LocalizedFields } from '../components/LocalizedFields';
import { ImageUpload } from '../components/ImageUpload';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

interface Article {
  _id: string;
  title: string;
  category: string;
  content: string;
  order?: number;
  images?: string[];
  externalLinks?: { label: string; url: string }[];
}

export function Articles() {
  const [items, setItems] = useState<Article[]>([]);
  const [form, setForm] = useState<Partial<Article>>({ title: '', category: 'practical', content: '' });
  const [titleI18n, setTitleI18n] = useState<I18nRecord>(emptyI18n);
  const [contentI18n, setContentI18n] = useState<I18nRecord>(emptyI18n);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [linksJson, setLinksJson] = useState('[]');

  const load = () => api<{ articles: Article[] }>('/admin/articles').then((r) => setItems(r.articles));
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ title: '', category: 'transport', content: '', images: [] });
    setTitleI18n(emptyI18n());
    setContentI18n(emptyI18n());
    setLinksJson('[]');
    setOpen(true);
  };

  const openEditArticle = (a: Article) => {
    setEditId(a._id);
    setForm({ ...a, images: a.images || [] });
    setTitleI18n(i18nFromDoc(a as Record<string, unknown>, 'title'));
    setContentI18n(i18nFromDoc(a as Record<string, unknown>, 'content'));
    setLinksJson(JSON.stringify(a.externalLinks || []));
    setOpen(true);
  };

  const save = async () => {
    const body = {
      ...form,
      title: titleI18n.tr || form.title || '',
      content: contentI18n.tr || form.content || '',
      titleI18n,
      contentI18n,
      images: form.images || [],
      externalLinks: JSON.parse(linksJson || '[]'),
    };
    if (editId) await api(`/admin/articles/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/articles', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  return (
    <div>
      <h1 className="page-title">Rehber Makaleleri</h1>
      <button type="button" className="btn-secondary" onClick={openNew}>
        + Makale
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Kategori</th>
              <th>Görsel</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td>{a.title}</td>
                <td>{a.category}</td>
                <td>{a.images?.length ? `${a.images.length} görsel` : '—'}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEditArticle(a)}>
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title="Makale" onClose={() => setOpen(false)} wide>
        <div className="form-grid">
          <LocalizedFields label="Başlık (çok dilli)" value={titleI18n} onChange={setTitleI18n} />
          <div>
            <label>Kategori</label>
            <input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <LocalizedFields label="İçerik (çok dilli)" value={contentI18n} onChange={setContentI18n} multiline rows={6} />
          <ImageUpload
            label="Görseller"
            value={form.images || []}
            onChange={(urls) => setForm({ ...form, images: urls })}
            multiple
            showUrlInput={false}
          />
          <div>
            <label>Harici linkler (JSON)</label>
            <textarea rows={3} value={linksJson} onChange={(e) => setLinksJson(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={save}>
            Kaydet
          </button>
        </div>
      </SimpleModal>
    </div>
  );
}
