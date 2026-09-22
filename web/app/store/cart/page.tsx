'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cartJson = localStorage.getItem('cart');
    if (cartJson) {
      setCartItems(JSON.parse(cartJson));
    }
  }, []);

  const removeFromCart = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCartItems([]);
  };

  const checkout = () => {
    // In a real app, we would send the cart to the backend to create an order.
    // For now, we'll just clear the cart and show a success message.
    localStorage.removeItem('cart');
    setCartItems([]);
    alert('Pedido finalizado com sucesso! Obrigado pela compra.');
    // Optionally, redirect to a thank you page or home.
  };

  const total: number = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Carrinho</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200">
          {error}
        </div>
      )}

      {cartItems.length === 0 ? (
        <p className="text-lg">Seu carrinho está vazio.</p>
      ) : (
        <>
          <div className="w-full max-w-4xl">
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
                  <td colSpan="3" className="p-4 text-right font-bold">
                    Total:
                  </td>
                  <td colSpan="2" className="p-4 text-left font-bold">
                    R$ {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-6 flex justify-between space-x-4">
            <button
              onClick={clearCart}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-500 transition"
            >
              Limpar Carrinho
            </button>
            <button
              onClick={checkout}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
            >
              Finalizar Pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}