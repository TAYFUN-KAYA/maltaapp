import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';

interface Question {
  _id: string;
  question: string;
  questionEn?: string;
  options: string[];
  answerIndex: number;
  order: number;
  active: boolean;
}

const empty = { question: '', questionEn: '', options: ['', '', ''], answerIndex: 0, order: 0, active: true };

export function LanguageTest() {
  const [items, setItems] = useState<Question[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [optionsText, setOptionsText] = useState('');

  const load = () => api<{ questions: Question[] }>('/admin/language-test').then((r) => setItems(r.questions));
  useEffect(() => { load(); }, []);

  const openEdit = (q?: Question) => {
    if (q) {
      setEditId(q._id);
      setForm({ question: q.question, questionEn: q.questionEn || '', options: q.options, answerIndex: q.answerIndex, order: q.order, active: q.active });
      setOptionsText(q.options.join('\n'));
    } else {
      setEditId(null);
      setForm(empty);
      setOptionsText('');
    }
    setOpen(true);
  };

  const save = async () => {
    const body = {
      ...form,
      options: optionsText.split('\n').map((x) => x.trim()).filter(Boolean),
    };
    if (editId) await api(`/admin/language-test/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/language-test', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Silinsin mi?')) return;
    await api(`/admin/language-test/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Dil Seviye Testi Soruları</h1>
      <button type="button" className="btn-secondary" onClick={() => openEdit()}>+ Soru</button>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Soru</th><th>Doğru</th><th></th></tr></thead>
          <tbody>
            {items.map((q, i) => (
              <tr key={q._id}>
                <td>{q.order ?? i}</td>
                <td style={{ maxWidth: 360 }}>{q.question}</td>
                <td>{q.options[q.answerIndex]}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEdit(q)}>Düzenle</button>
                  <button type="button" className="btn-sm" onClick={() => remove(q._id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title={editId ? 'Soru düzenle' : 'Yeni soru'} onClose={() => setOpen(false)}>
        <div className="form-grid">
          <div><label>Soru (TR)</label><textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
          <div><label>Soru (EN)</label><textarea value={form.questionEn} onChange={(e) => setForm({ ...form, questionEn: e.target.value })} /></div>
          <div><label>Seçenekler (her satır bir seçenek)</label><textarea rows={4} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} /></div>
          <div><label>Doğru cevap indeksi (0-based)</label><input type="number" value={form.answerIndex} onChange={(e) => setForm({ ...form, answerIndex: Number(e.target.value) })} /></div>
          <div><label>Sıra</label><input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
        </div>
        <div className="modal-actions"><button type="button" className="btn-sm" onClick={save}>Kaydet</button></div>
      </SimpleModal>
    </div>
  );
}
