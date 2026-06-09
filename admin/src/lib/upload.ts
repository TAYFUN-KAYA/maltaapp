const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('admin_token');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/upload/admin`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data.url as string;
}
