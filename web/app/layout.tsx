import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Focus Ecommerce',
  description: 'Ecommerce application built with Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white min-h-screen">
        {/* Navigation bar */}
        <nav className="bg-red-600 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-white hover:underline">
              Focus Ecommerce
            </a>
            <div className="space-x-4">
              <a href="/" className="hover:text-red-200">
                Home
              </a>
              <a href="/cadastrar-produto" className="hover:text-red-200">
                Cadastrar Produto
              </a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}