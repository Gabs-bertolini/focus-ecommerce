'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<CreateProductDTO>({
    name: '',
    price: 0,
    stock: 0,
    image: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
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
      let res;
      if (editingId !== null) {
        // Update
        res = await fetch(`/api/products/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(form),
        });
      } else {
        // Create
        res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(form),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to save product');
      }

      const savedProduct: Product = normalizeProduct(await res.json());
      // Update list
      if (editingId !== null) {
        setProducts(prev =>
          prev.map(p => (p.id === editingId ? savedProduct : p)),
        );
        setEditingId(null);
      } else {
        setProducts(prev => [...prev, savedProduct]);
      }
      // Reset form
      setForm({ name: '', price: 0, stock: 0, image: '' });
    } catch (err) {
      console.error(err);
      setError('Could not save product');
      alert('Could not save product: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) {
        let message = `Failed to delete product (${res.status})`;
        try {
          const errorData = await res.json();
          message = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message || message;
        } catch {
          // Keep the status-based message when the API has no JSON response.
        }

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          router.push('/login');
          return;
        }

        throw new Error(message);
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      setError(`Could not delete product: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Gerenciar Produtos</h1>

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
          {editingId !== null ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </button>
        {editingId !== null && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', price: 0, stock: 0, image: '' });
            }}
            className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            Cancelar edição
          </button>
        )}
      </form>

      {products.length > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Lista de Produtos</h2>
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
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-500 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500 transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}