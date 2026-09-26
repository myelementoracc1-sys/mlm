'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400">Loading administrative metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Executive Overview
        </span>
        <h1 className="text-3xl font-bold text-white mt-1">Platform Control Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time metrics, system wallet liabilities, and recent financial transactions.
        </p>
      </div>

      {/* High Level Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Members</p>
          <p className="text-3xl font-extrabold text-white mt-2">{stats?.totalMembers || 0}</p>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">{stats?.activeMembers || 0} Active</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Wallet Liabilities</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            R {parseFloat(stats?.walletLiabilities || '0').toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Derived from active ledger</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rewards Generated</p>
          <p className="text-3xl font-extrabold text-indigo-400 mt-2">
            R {parseFloat(stats?.totalRewards || '0').toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total commission awards</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Plan Version</p>
          <p className="text-lg font-bold text-teal-400 mt-2 truncate">
            {stats?.activePlanVersion || 'None Active'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Versioned engine status</p>
        </div>
      </div>

      {/* Recent Ledger Transactions */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Recent System Transactions</h3>
        {stats?.recentTransactions?.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 font-semibold text-white">
                      {tx.member?.firstName} {tx.member?.lastName}{' '}
                      <span className="font-mono text-xs text-slate-400">({tx.member?.memberCode})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-400">
                      {tx.walletCode}
                    </td>
                    <td className="px-4 py-3 text-xs">{tx.type}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      R {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
