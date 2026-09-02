import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api, { apiMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Feedback';

export default function Login() {
  const { isAuthenticated, saveSession } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { const { data } = await api.post('/auth/login', form); saveSession(data.data); navigate('/dashboard'); } catch (err) { setError(apiMessage(err, 'Invalid login credentials.')); } finally { setLoading(false); } };
  return <section className="auth-card"><h1>Welcome back</h1><p>Log in to manage shared expenses.</p><Alert>{error}</Alert><form onSubmit={submit}><label>Email<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label><button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button></form><p>New here? <Link to="/register">Create an account</Link></p></section>;
}
