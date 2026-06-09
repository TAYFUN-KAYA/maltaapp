import { useState } from 'react';
import { CONTENT_LANGS, type I18nRecord } from '../lib/contentLocales';

type Props = {
  label: string;
  value: I18nRecord;
  onChange: (value: I18nRecord) => void;
  multiline?: boolean;
  rows?: number;
};

export function LocalizedFields({ label, value, onChange, multiline, rows = 3 }: Props) {
  const [tab, setTab] = useState<string>('tr');

  const setForTab = (text: string) => {
    onChange({ ...value, [tab]: text });
  };

  return (
    <div className="localized-fields">
      <label>{label}</label>
      <div className="lang-tabs">
        {CONTENT_LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`lang-tab ${tab === l.code ? 'active' : ''}`}
            onClick={() => setTab(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea rows={rows} value={value[tab as keyof I18nRecord] || ''} onChange={(e) => setForTab(e.target.value)} />
      ) : (
        <input value={value[tab as keyof I18nRecord] || ''} onChange={(e) => setForTab(e.target.value)} />
      )}
      <p className="localized-hint">TR zorunlu; diğer diller boşsa uygulama TR veya EN gösterir.</p>
    </div>
  );
}
