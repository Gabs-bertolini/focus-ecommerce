'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

type CreateProductDTO = Omit<Product, 'id'>;

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: Number(product.price),
    stock: Number(product.stock),
  };
}

export default function CadastrarProdutoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<CreateProductDTO>({
    name: '',
    price: 0,
    stock: 0,
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on mount
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
      }
    };

    void loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!form.name || form.price <= 0 || form.stock < 0 || !form.image) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to create product');
      }

      const createdProduct: Product = normalizeProduct(await res.json());
      // Add to local list (optimistic) or refetch
      setProducts(prev => [...prev, createdProduct]);
      // Reset form
      setForm({ name: '', price: 0, stock: 0, image: '' });
    } catch (err) {
      console.error(err);
      setError('Could not create product');
      alert('Could not create product: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Cadastrar Produto</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 bg-gray-800 p-6 rounded">
        <div>
          <label className="block mb-2">Nome do produto</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block mb-2">Preço (R$)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block mb-2">Estoque</label>
          <input
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block mb-2">URL da imagem</label>
          <input
            name="image"
            type="text"
            value={form.image}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Cadastrando...' : 'Cadastrar Produto'}
        </button>
      </form>

      {products.length > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Produtos Cadastrados</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <div key={product.id} className="bg-gray-800 p-4 rounded text-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                <p className="text-gray-300 mb-1">Preço: R$ {product.price.toFixed(2)}</p>
                <p className="text-gray-300 mb-1">Estoque: {product.stock}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}