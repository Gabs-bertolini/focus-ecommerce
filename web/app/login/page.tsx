'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { access_token } = await res.json();
      // Decode JWT to get role (we'll do it client-side for simplicity)
      const payload = JSON.parse(atob(access_token.split('.')[1]));
      const isAdmin = payload.isAdmin as boolean;

      localStorage.setItem('token', access_token);
      localStorage.setItem('role', isAdmin ? 'admin' : 'user');

      // Redirect based on role
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/store');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="page-eyebrow">Focus Ecommerce</p>
        <h1>Login</h1>
        <p>Acesse sua conta para continuar.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="auth-footnote">
            Não tem conta? <Link href="/register">Cadastre-se</Link>
          </p>
        </form>
      </section>
    </div>
  );
}