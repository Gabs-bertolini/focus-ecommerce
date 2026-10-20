'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-shell">
      <section className="home-panel">
        <p className="page-eyebrow">Focus Ecommerce</p>
        <h1>Bem-vindo ao <span>Focus Ecommerce</span></h1>
        <p>
          Use o menu acima para navegar entre as telas de administração e loja.
        </p>
        <div className="home-actions">
          <Link href="/store" className="button-link button-link-primary">
            Explorar loja
          </Link>
          <Link href="/admin/dashboard" className="button-link button-link-secondary">
            Acessar administração
          </Link>
        </div>
      </section>
    </div>
  );
}