'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: Number(product.price),
    stock: Number(product.stock),
  };
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data: Product[] = await res.json();
        setProducts(data.map(normalizeProduct));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load products');
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    let cart: Product[] = [];
    const cartJson = localStorage.getItem('cart');
    if (cartJson) {
      cart = JSON.parse(cartJson);
    }
    // Check if product already in cart, if yes increase quantity? We'll just add another entry for simplicity.
    // For a real cart, we'd want to aggregate by product id and have a quantity.
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Loja</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-lg">Carregando produtos...</p>
      ) : (
        <div className="w-full max-w-4xl">
          {products.length === 0 ? (
            <p>Nenhum produto disponível.</p>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map(product => (
                <div key={product.id} className="bg-gray-800 p-4 rounded">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover mb-4 rounded"
                  />
                  <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                  <p className="text-gray-300 mb-1">Preço: R$ {product.price.toFixed(2)}</p>
                  <p className="text-gray-300 mb-1">Estoque: {product.stock}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    Adicionar ao Carrinho
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}