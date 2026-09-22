'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Fetch stats from backend (we'll create a mock endpoint or use existing products endpoint)
    // For now, we'll mock
    const mockStats = {
      totalProducts: 5,
      totalSales: 12,
      totalRevenue: 245.50,
    };
    setStats(mockStats);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-red-500 mb-6">Admin Dashboard</h1>
      <div className="bg-gray-800 p-6 rounded w-full max-w-2xl space-y-4">
        <div className="flex justify-between">
          <span className="text-lg">Total Products:</span>
          <span className="text-lg font-bold">{stats.totalProducts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg">Total Sales:</span>
          <span className="text-lg font-bold">{stats.totalSales}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg">Total Revenue:</span>
          <span className="text-lg font-bold">R$ {stats.totalRevenue.toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-6">
        <a
          href="/admin/products"
          className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition"
        >
          Manage Products
        </a>
      </div>
    </div>
  );
}