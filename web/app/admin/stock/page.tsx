'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  stock: number;
};

type MovementType = 'entry' | 'withdrawal' | 'adjustment';

type StockMovement = {
  id: number;
  productId: number;
  productName: string;
  type: MovementType;
  previousStock: number;
  currentStock: number;
  note: string | null;
  createdAt: string;
};

type InventoryData = {
  products: Product[];
  movements: StockMovement[];
};

const movementLabels: Record<MovementType, string> = {
  entry: 'Entrada',
  withdrawal: 'Baixa',
  adjustment: 'Ajuste',
};

async function fetchInventory(token: string): Promise<InventoryData> {
  const headers = { Authorization: `Bearer ${token}` };
  const [productsResponse, movementsResponse] = await Promise.all([
    fetch('/api/products', { headers }),
    fetch('/api/products/stock-movements', { headers }),
  ]);

  if (productsResponse.status === 401 || movementsResponse.status === 401) {
    throw new Error('Sessão expirada. Entre novamente para continuar.');
  }
  if (movementsResponse.status === 403) {
    throw new Error('Esta área está disponível somente para administradores.');
  }
  if (!productsResponse.ok || !movementsResponse.ok) {
    throw new Error('Não foi possível carregar os dados do estoque.');
  }

  const products: Product[] = await productsResponse.json();
  const movements: StockMovement[] = await movementsResponse.json();
  return {
    products: products.map(product => ({ ...product, stock: Number(product.stock) })),
    movements,
  };
}

export default function AdminStockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('withdrawal');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.replace(role === 'user' ? '/store' : '/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    let active = true;
    fetchInventory(token)
      .then(data => {
        if (!active) return;
        setProducts(data.products);
        setMovements(data.movements);
        setSelectedProductId(current => current || String(data.products[0]?.id ?? ''));
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!active) return;
        setError(loadError.message);
        if (loadError.message.startsWith('Sessão expirada')) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          router.replace('/login');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const selectedProduct = products.find(
    product => String(product.id) === selectedProductId,
  );
  const lowStockCount = products.filter(
    product => product.stock > 0 && product.stock <= 5,
  ).length;
  const outOfStockCount = products.filter(product => product.stock === 0).length;
  const totalUnits = products.reduce((total, product) => total + product.stock, 0);
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.stock > 0 && product.stock <= 5) ||
      (stockFilter === 'out' && product.stock === 0);
    return matchesSearch && matchesStock;
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;

    const amount = Number(quantity);
    if (
      !Number.isInteger(amount) ||
      amount < 0 ||
      (movementType !== 'adjustment' && amount === 0) ||
      (movementType === 'withdrawal' && amount > selectedProduct.stock) ||
      (movementType === 'adjustment' && amount === selectedProduct.stock)
    ) {
      setError('Informe uma quantidade válida para o saldo selecionado.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/stock-movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: movementType, quantity: amount, note }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.replace('/login');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Não foi possível salvar a movimentação.');
      }

      const inventory = await fetchInventory(token);
      setProducts(inventory.products);
      setMovements(inventory.movements);
      setQuantity('');
      setNote('');
      setSuccess('Movimentação registrada com sucesso.');
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] bg-black text-white" />;
  }

  return (
    <div className="page-shell mx-auto max-w-7xl text-white">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-red-400">
            Administração
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Controle de estoque</h1>
          <p className="mt-2 text-zinc-400">Saldo atual e histórico de movimentações</p>
        </div>
        <Link
          href="/admin/products"
          className="rounded border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-red-500 hover:text-white"
        >
          Gerenciar produtos
        </Link>
      </header>

      {error && (
        <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-950/60 px-4 py-3 text-red-100">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-5 border-l-4 border-emerald-500 bg-emerald-950/50 px-4 py-3 text-emerald-100">
          {success}
        </div>
      )}

      <section aria-label="Resumo do estoque" className="mb-8 grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-3">
        <div className="bg-zinc-950 p-5">
          <p className="text-sm text-zinc-400">Unidades em estoque</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{totalUnits}</p>
        </div>
        <div className="bg-zinc-950 p-5">
          <p className="text-sm text-zinc-400">Estoque baixo · até 5 un.</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-300">{lowStockCount}</p>
        </div>
        <div className="bg-zinc-950 p-5">
          <p className="text-sm text-zinc-400">Sem estoque</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-red-400">{outOfStockCount}</p>
        </div>
      </section>

      <section className="mb-10 border-y border-zinc-800 py-6">
        <h2 className="mb-5 text-xl font-semibold">Registrar movimentação</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm text-zinc-300">
            Produto
            <select
              value={selectedProductId}
              onChange={event => setSelectedProductId(event.target.value)}
              required
              disabled={!products.length || loading}
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:border-red-500 focus:outline-none"
            >
              {products.length === 0 && <option value="">Nenhum produto cadastrado</option>}
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.stock} un.
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Tipo
            <select
              value={movementType}
              onChange={event => setMovementType(event.target.value as MovementType)}
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="withdrawal">Baixa</option>
              <option value="entry">Entrada</option>
              <option value="adjustment">Ajuste de saldo</option>
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            {movementType === 'adjustment' ? 'Novo saldo' : 'Quantidade'}
            <input
              id="stock-movement-quantity"
              type="number"
              min={movementType === 'adjustment' ? 0 : 1}
              max={movementType === 'withdrawal' ? selectedProduct?.stock : undefined}
              step="1"
              required
              value={quantity}
              onChange={event => setQuantity(event.target.value)}
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:border-red-500 focus:outline-none"
            />
          </label>
          <label className="text-sm text-zinc-300">
            Observação
            <input
              value={note}
              maxLength={500}
              onChange={event => setNote(event.target.value)}
              placeholder="Opcional"
              className="mt-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving || loading || !products.length}
              className="w-full rounded bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
        {selectedProduct && (
          <p className="mt-3 text-sm text-zinc-500">
            Saldo atual de {selectedProduct.name}: {selectedProduct.stock} unidades
          </p>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Produtos</h2>
            <p className="mt-1 text-sm text-zinc-500">{filteredProducts.length} itens</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="sr-only" htmlFor="product-search">Buscar produto</label>
            <input
              id="product-search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar produto"
              className="w-48 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
            />
            <label className="sr-only" htmlFor="stock-filter">Filtrar estoque</label>
            <select
              id="stock-filter"
              value={stockFilter}
              onChange={event => setStockFilter(event.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            >
              <option value="all">Todos os saldos</option>
              <option value="low">Estoque baixo</option>
              <option value="out">Sem estoque</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto border border-zinc-800">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Produto</th>
                <th scope="col" className="px-4 py-3 font-medium">Saldo atual</th>
                <th scope="col" className="px-4 py-3 font-medium">Situação</th>
                <th scope="col" className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Carregando estoque...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">Nenhum produto encontrado.</td></tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="bg-black transition hover:bg-zinc-950">
                  <th scope="row" className="px-4 py-3 font-medium text-white">{product.name}</th>
                  <td className="px-4 py-3 tabular-nums">{product.stock} un.</td>
                  <td className="px-4 py-3">
                    {product.stock === 0 ? (
                      <span className="text-red-400">Sem estoque</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-amber-300">Baixo</span>
                    ) : (
                      <span className="text-emerald-400">Disponível</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(String(product.id));
                        setMovementType('withdrawal');
                        document.getElementById('stock-movement-quantity')?.focus();
                      }}
                      className="font-medium text-red-400 hover:text-red-300"
                    >
                      Dar baixa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Histórico de movimentações</h2>
            <p className="mt-1 text-sm text-zinc-500">Registros mais recentes · máximo de 100</p>
          </div>
        </div>
        <div className="overflow-x-auto border border-zinc-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Data e hora</th>
                <th scope="col" className="px-4 py-3 font-medium">Produto</th>
                <th scope="col" className="px-4 py-3 font-medium">Movimentação</th>
                <th scope="col" className="px-4 py-3 font-medium">Alteração</th>
                <th scope="col" className="px-4 py-3 font-medium">Saldo</th>
                <th scope="col" className="px-4 py-3 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Carregando histórico...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Ainda não há movimentações registradas.</td></tr>
              ) : movements.map(movement => (
                <tr key={movement.id} className="bg-black">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(movement.createdAt))}
                  </td>
                  <th scope="row" className="px-4 py-3 font-medium text-white">{movement.productName}</th>
                  <td className="px-4 py-3">{movementLabels[movement.type]}</td>
                  <td className={`px-4 py-3 tabular-nums ${movement.currentStock < movement.previousStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {movement.currentStock - movement.previousStock > 0 ? '+' : ''}{movement.currentStock - movement.previousStock} un.
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {movement.previousStock} → {movement.currentStock}
                  </td>
                  <td className="max-w-56 truncate px-4 py-3 text-zinc-400" title={movement.note ?? undefined}>
                    {movement.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}