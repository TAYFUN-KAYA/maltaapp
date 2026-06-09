import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@maltstart.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>MaltaStart Admin</h1>
        <p style={{ color: '#6b7c8f', marginBottom: 24 }}>Yönetim paneline giriş</p>
        {error && <p className="error">{error}</p>}
        <label>E-posta</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Şifre</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button type="submit">Giriş Yap</button>
      </form>
    </div>
  );
}
