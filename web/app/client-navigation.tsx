'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getServerRole = () => ''
const getClientRole = () => localStorage.getItem('role') || ''

export default function ClientNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const role = useSyncExternalStore(emptySubscribe, getClientRole, getServerRole)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token && pathname !== '/login') {
      router.replace('/login')
      return
    }
  }, [pathname, router])

  if (pathname === '/login') {
    return null
  }

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-brand">
          Focus <span>Ecommerce</span>
        </Link>
        <div className="site-nav-links">
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className="site-nav-link">
            Home
          </Link>
          {role === 'admin' && (
            <>
              <Link href="/admin/dashboard" aria-current={pathname === '/admin/dashboard' ? 'page' : undefined} className="site-nav-link">
                Admin Dashboard
              </Link>
              <Link href="/admin/products" aria-current={pathname === '/admin/products' ? 'page' : undefined} className="site-nav-link">
                Gerenciar Produtos
              </Link>
              <Link href="/admin/stock" aria-current={pathname === '/admin/stock' ? 'page' : undefined} className="site-nav-link">
                Controle de Estoque
              </Link>
            </>
          )}
          {role === 'user' && (
            <>
              <Link href="/store" aria-current={pathname === '/store' ? 'page' : undefined} className="site-nav-link">
                Loja
              </Link>
              <Link href="/store/cart" aria-current={pathname === '/store/cart' ? 'page' : undefined} className="site-nav-link">
                Carrinho
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}