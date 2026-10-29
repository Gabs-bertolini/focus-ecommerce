"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DailySales = {
  date: string;
  orders: number;
  revenue: number;
  costs: number;
};

type RecentSale = {
  id: number;
  customerEmail: string;
  createdAt: string;
  status: string;
  total: number;
  costs: number;
};

type DashboardData = {
  periodDays: number;
  orders: number;
  revenue: number;
  costs: number;
  profit: number;
  productCount: number;
  stockUnits: number;
  daily: DailySales[];
  recentSales: RecentSale[];
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

function formatCurrency(value: number) {
  return currency.format(value);
}

function makeChartPoints(daily: DailySales[], field: "revenue" | "costs") {
  const maximum = Math.max(
    1,
    ...daily.flatMap((day) => [day.revenue, day.costs]),
  );
  return daily
    .map((day, index) => {
      const x = 42 + (index / Math.max(daily.length - 1, 1)) * 620;
      const y = 190 - (day[field] / maximum) * 158;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.replace(role === "customer" ? "/store" : "/login");
      return;
    }

    let active = true;
    const token = localStorage.getItem("token");
    fetch("/api/sales/dashboard", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          router.replace("/login");
          return null;
        }
        if (response.status === 403) {
          throw new Error(
            "Esta área está disponível somente para administradores.",
          );
        }
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados da dashboard.");
        }
        return (await response.json()) as DashboardData;
      })
      .then((dashboard) => {
        if (!active || !dashboard) return;
        setData(dashboard);
      })
      .catch((loadError: Error) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div
        className="page-shell min-h-[60vh] text-zinc-400"
        role="status"
        aria-live="polite"
      >
        Carregando indicadores de vendas...
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-7xl text-white">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-red-400">
            Administração · Visão geral
          </p>
          <h1 className="page-title mb-2">Dashboard</h1>
          <p className="text-zinc-400">
            Vendas, custos e desempenho dos últimos {data?.periodDays ?? 30}{" "}
            dias
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products"
            className="rounded border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-red-500 hover:text-white"
          >
            Gerenciar produtos
          </Link>
          <Link
            href="/admin/stock"
            className="button-link button-link-primary px-4 py-2 text-sm"
          >
            Controle de estoque
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 border-l-4 border-red-500 bg-red-950/60 px-4 py-3 text-red-100"
        >
          {error}
        </div>
      )}

      {!error && data && (
        <>
          <section
            aria-label="Indicadores de vendas"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Faturamento"
              value={formatCurrency(data.revenue)}
              accent="text-white"
            />
            <MetricCard
              label="Custos dos produtos"
              value={formatCurrency(data.costs)}
              accent="text-amber-300"
            />
            <MetricCard
              label="Lucro bruto estimado"
              value={formatCurrency(data.profit)}
              accent="text-emerald-300"
            />
            <MetricCard
              label="Pedidos concluídos"
              value={String(data.orders)}
              accent="text-red-300"
            />
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-sm text-zinc-400">Produtos cadastrados</p>
              <p className="mt-2 text-2xl font-bold">{data.productCount}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-sm text-zinc-400">Unidades em estoque</p>
              <p className="mt-2 text-2xl font-bold">{data.stockUnits}</p>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Vendas x custos</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Comparativo diário dos últimos {data.periodDays} dias
                </p>
              </div>
              <div className="flex gap-4 text-xs text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  Vendas
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  Custos
                </span>
              </div>
            </div>
            {data.daily.some((day) => day.revenue > 0 || day.costs > 0) ? (
              <div className="overflow-x-auto">
                <svg
                  viewBox="0 0 700 235"
                  role="img"
                  aria-label="Gráfico diário comparando faturamento e custos dos produtos"
                  className="h-56 min-w-[620px] w-full"
                >
                  {[42, 91, 140, 190].map((y) => (
                    <line
                      key={y}
                      x1="42"
                      x2="662"
                      y1={y}
                      y2={y}
                      stroke="#303235"
                      strokeDasharray="4 5"
                    />
                  ))}
                  <polyline
                    points={makeChartPoints(data.daily, "revenue")}
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={makeChartPoints(data.daily, "costs")}
                    fill="none"
                    stroke="#fcd34d"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {data.daily
                    .filter(
                      (_, index) =>
                        index % 7 === 0 || index === data.daily.length - 1,
                    )
                    .map((day) => {
                      const index = data.daily.indexOf(day);
                      const x =
                        42 + (index / Math.max(data.daily.length - 1, 1)) * 620;
                      return (
                        <text
                          key={day.date}
                          x={x}
                          y="220"
                          fill="#a1a1aa"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {shortDate.format(new Date(`${day.date}T00:00:00Z`))}
                        </text>
                      );
                    })}
                </svg>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-center text-sm text-zinc-400">
                Ainda não há vendas neste período. Os dados aparecerão aqui após
                os primeiros pedidos.
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              O lucro bruto considera apenas o custo unitário cadastrado para
              cada produto.
            </p>
          </section>

          <section className="mt-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="font-semibold">Vendas recentes</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Últimos pedidos registrados na loja
                </p>
              </div>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                {data.recentSales.length} pedidos
              </span>
            </div>
            {data.recentSales.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Pedido</th>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Valor</th>
                      <th className="px-5 py-3 font-medium">Custo</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.recentSales.map((sale) => (
                      <tr key={sale.id} className="text-zinc-200">
                        <td className="px-5 py-4 font-semibold">#{sale.id}</td>
                        <td className="px-5 py-4">{sale.customerEmail}</td>
                        <td className="px-5 py-4 text-zinc-400">
                          {new Date(sale.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-5 py-4">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="px-5 py-4 text-amber-200">
                          {formatCurrency(sale.costs)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            Concluída
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${accent}`}>
        {value}
      </p>
    </div>
  );
}
