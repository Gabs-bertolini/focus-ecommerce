'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

const CART_UPDATED_EVENT = 'focus-cart-updated';

function subscribeToCart(callback: () => void) {
  window.addEventListener(CART_UPDATED_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getCartSnapshot() {
  return localStorage.getItem('cart') ?? '[]';
}

function saveCart(items: Product[]) {
  if (items.length === 0) {
    localStorage.removeItem('cart');
  } else {
    localStorage.setItem('cart', JSON.stringify(items));
  }
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export default function CartPage() {
  const router = useRouter();
  const cartSnapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => '[]',
  );
  const cartItems = useMemo(
    () => JSON.parse(cartSnapshot) as Product[],
    [cartSnapshot],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const removeFromCart = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    saveCart(updatedCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const checkout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const quantities = new Map<number, number>();
      for (const item of cartItems) {
        quantities.set(item.id, (quantities.get(item.id) ?? 0) + 1);
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token')
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
            : {}),
        },
        body: JSON.stringify({
          items: [...quantities].map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = Array.isArray(errorData?.message)
          ? errorData.message.join(', ')
          : errorData?.message;
        throw new Error(message || 'Não foi possível finalizar o pedido.');
      }

      const sale: { id: number } = await response.json();
      saveCart([]);
      setSuccess(
        `Pedido #${sale.id} finalizado com sucesso. Obrigado pela compra!`,
      );
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Não foi possível finalizar o pedido.',
      );
    } finally {
      setLoading(false);
    }
  };

  const total: number = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="page-shell">
      <p className="page-eyebrow">Sua compra</p>
      <h1 className="text-3xl font-bold text-red-500 mb-6">Carrinho</h1>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mb-4 border-l-4 border-emerald-500 bg-emerald-950/50 px-4 py-3 text-emerald-100"
        >
          {success}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <h2>Seu carrinho está vazio.</h2>
          <p>
            Quando encontrar algo que goste, adicione ao carrinho para
            continuar.
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-4 text-left">Produto</th>
                  <th className="p-4 text-left">Preço</th>
                  <th className="p-4 text-left">Qtd</th>
                  <th className="p-4 text-left">Subtotal</th>
                  <th className="p-4 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-4 flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span>{item.name}</span>
                    </td>
                    <td className="p-4">R$ {item.price.toFixed(2)}</td>
                    <td className="p-4">1</td>
                    <td className="p-4">R$ {item.price.toFixed(2)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800">
                  <td colSpan={3} className="p-4 text-right font-bold">
                    Total:
                  </td>
                  <td colSpan={2} className="p-4 text-left font-bold">
                    R$ {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="action-row mt-6 flex justify-between space-x-4">
            <button
              onClick={clearCart}
              disabled={loading}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-500 transition"
            >
              Limpar Carrinho
            </button>
            <button
              onClick={checkout}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
            >
              {loading ? 'Finalizando...' : 'Finalizar Pedido'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
