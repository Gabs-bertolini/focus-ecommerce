'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-4xl font-bold text-red-500 mb-6">Bem-vindo ao Focus Ecommerce</h1>
      <p className="text-lg mb-8">
        Use o menu acima para navegar entre as telas de cadastro de produtos e login.
      </p>
      <div className="space-x-4">
        <a
          href="/cadastrar-produto"
          className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
        >
          Cadastrar Produto
        </a>
      </div>
    </div>
  );
}