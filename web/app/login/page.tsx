'use client';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In a real app, validate credentials here
    // For now, just set logged in if fields are not empty
    if (email && password) {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/');
    } else {
      alert('Preencha todos os campos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button type="submit" className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
          Entrar
        </button>
        <p className="text-center text-sm text-gray-400">
          Não tem conta? <a href="#" className="text-red-400 hover:underline">Cadastre-se</a>
        </p>
      </form>
    </div>
  );
}