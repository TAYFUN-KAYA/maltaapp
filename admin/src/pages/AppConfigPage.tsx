import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function AppConfigPage() {
  const [linksJson, setLinksJson] = useState('[]');
  const [welcomeTr, setWelcomeTr] = useState('');
  const [welcomeEn, setWelcomeEn] = useState('');

  useEffect(() => {
    api<{ config: { quickLinks: unknown[]; chatbotWelcome?: Record<string, string> } }>('/admin/app-config').then(
      (r) => {
        setLinksJson(JSON.stringify(r.config.quickLinks || [], null, 2));
        setWelcomeTr(r.config.chatbotWelcome?.tr || '');
        setWelcomeEn(r.config.chatbotWelcome?.en || '');
      }
    );
  }, []);

  const save = async () => {
    await api('/admin/app-config', {
      method: 'PATCH',
      body: JSON.stringify({
        quickLinks: JSON.parse(linksJson),
        chatbotWelcome: { tr: welcomeTr, en: welcomeEn, de: welcomeEn, ar: welcomeEn, es: welcomeEn },
      }),
    });
    alert('Kaydedildi');
  };

  return (
    <div>
      <h1 className="page-title">Uygulama Ayarları</h1>
      <p>
        Acil destek içeriği için{' '}
        <Link to="/emergency" style={{ color: '#0a6e8a', fontWeight: 700 }}>
          Acil Destek
        </Link>{' '}
        sayfasını kullanın (çok dilli başlık ve numaralar).
      </p>
      <div className="form-grid" style={{ maxWidth: 640 }}>
        <div>
          <label>Hızlı linkler (JSON)</label>
          <textarea rows={6} value={linksJson} onChange={(e) => setLinksJson(e.target.value)} />
        </div>
        <div>
          <label>Chatbot karşılama (TR)</label>
          <textarea rows={2} value={welcomeTr} onChange={(e) => setWelcomeTr(e.target.value)} />
        </div>
        <div>
          <label>Chatbot karşılama (EN)</label>
          <textarea rows={2} value={welcomeEn} onChange={(e) => setWelcomeEn(e.target.value)} />
        </div>
        <button type="button" className="btn-secondary" onClick={save}>
          Kaydet
        </button>
      </div>
    </div>
  );
}
