import './globals.css'
import type { ReactNode } from 'react'
import ClientNavigation from './client-navigation'

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
        <ClientNavigation />
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}