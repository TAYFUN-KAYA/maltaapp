import { useState } from 'react';
import { uploadFile } from '../lib/upload';

export function ImageUpload({
  label,
  value,
  onChange,
  multiple,
  showUrlInput = true,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  showUrlInput?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file));
      }
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <label>{label}</label>
      <input type="file" accept="image/*" multiple={multiple} onChange={onPick} disabled={busy} />
      {busy && <small>Yükleniyor...</small>}
      {error && <small style={{ color: '#e74c3c' }}>{error}</small>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {value.map((url) => (
          <div key={url} style={{ position: 'relative' }}>
            <img src={url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
            <button type="button" className="btn-sm" style={{ marginTop: 4 }} onClick={() => remove(url)}>
              Sil
            </button>
          </div>
        ))}
      </div>
      {showUrlInput && (
        <input
          style={{ marginTop: 8, width: '100%' }}
          placeholder="veya URL yapıştır (virgülle)"
          value={value.join(', ')}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
            )
          }
        />
      )}
    </div>
  );
}
