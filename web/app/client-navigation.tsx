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
    <nav className="bg-red-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white hover:underline">
          Focus Ecommerce
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-red-200">
            Home
          </Link>
          {role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="hover:text-red-200">
                Admin Dashboard
              </Link>
              <Link href="/admin/products" className="hover:text-red-200">
                Gerenciar Produtos
              </Link>
            </>
          )}
          {role === 'user' && (
            <>
              <Link href="/store" className="hover:text-red-200">
                Loja
              </Link>
              <Link href="/store/cart" className="hover:text-red-200">
                Carrinho
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}