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
      <body>
        <ClientNavigation />
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}