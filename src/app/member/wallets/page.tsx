'use client';

import { useEffect, useState } from 'react';

export default function MemberWalletsPage() {
  const [balances, setBalances] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/member/wallets');
        if (res.ok) {
          const data = await res.json();
          setBalances(data.balances);
          setTransactions(data.recentTransactions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400">Loading wallet ledger...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallets & Audit Ledger</h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable ledger record powering your real-time derived wallet balances.
        </p>
      </div>

      {/* Balances Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {balances &&
          Object.entries(balances).map(([code, data]: [string, any]) => (
            <div key={code} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-800 text-emerald-400">
                {code}
              </span>
              <h4 className="text-sm font-medium text-slate-400 mt-3">{data.definition.name}</h4>
              <p className="text-2xl font-extrabold text-white mt-1">
                R {parseFloat(data.balance.toString()).toFixed(2)}
              </p>
            </div>
          ))}
      </div>

      {/* Ledger Transactions Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Immutable Ledger Transactions</h3>

        {transactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No ledger transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-400">
                      {tx.walletCode}
                    </td>
                    <td className="px-4 py-3 text-xs">{tx.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.direction === 'CREDIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {tx.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      R {parseFloat(tx.amount.toString()).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{tx.description}</td>
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
