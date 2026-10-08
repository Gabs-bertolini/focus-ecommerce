'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // Basic validation
      if (!email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // isAdmin defaults to false
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      await res.json(); // we don't need the data
      setSuccess('Registration successful! Please login.');
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Optionally redirect after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="page-eyebrow">Focus Ecommerce</p>
        <h1>Create Account</h1>
        <p>Crie sua conta para acompanhar e aproveitar a loja.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded text-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          <p className="auth-footnote">
            Already have an account? <Link href="/login">Login here</Link>
          </p>
        </form>
      </section>
    </div>
  );
}