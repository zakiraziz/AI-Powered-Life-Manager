import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Input, Button, Spinner } from '../components/UI';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to NexOS! 🚀');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 'var(--r3)', padding: 36,
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Nex<span style={{ color: 'var(--purple2)' }}>OS</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Start your productivity journey</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Your name"
            placeholder="Alex"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
          />
          <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <><Spinner size={14} /> Creating account...</> : 'Create account →'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--purple2)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
