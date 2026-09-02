import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api, { apiMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Feedback';

export default function Register() {
  const { isAuthenticated, saveSession } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { const { data } = await api.post('/auth/register', form); saveSession(data.data); navigate('/dashboard'); } catch (err) { setError(apiMessage(err, 'Unable to create your account.')); } finally { setLoading(false); } };
  return <section className="auth-card"><h1>Create account</h1><p>Start splitting expenses with your groups.</p><Alert>{error}</Alert><form onSubmit={submit}><label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" minLength="6" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button disabled={loading}>{loading ? 'Creating...' : 'Register'}</button></form><p>Already registered? <Link to="/login">Log in</Link></p></section>;
}
