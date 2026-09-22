'use client';

import { useState } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

export default function CadastrarProdutoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    stock: 0,
    image: '',
  });
  const [nextId, setNextId] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0 || form.stock < 0 || !form.image) {
      alert('Preencha todos os campos corretamente');
      return;
    }
    const newProduct: Product = { ...form, id: nextId };
    setProducts(prev => [...prev, newProduct]);
    setNextId(prev => prev + 1);
    setForm({ name: '', price: 0, stock: 0, image: '' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Cadastrar Produto</h1>
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
        <button type="submit" className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
          Cadastrar Produto
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