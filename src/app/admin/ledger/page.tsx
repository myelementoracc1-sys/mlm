'use client';

import { useEffect, useState } from 'react';

export default function AdminLedgerPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCodeFilter, setMemberCodeFilter] = useState('');
  const [walletCodeFilter, setWalletCodeFilter] = useState('');

  // Reversal modal state
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (memberCodeFilter) params.append('memberCode', memberCodeFilter);
      if (walletCodeFilter) params.append('walletCode', walletCodeFilter);

      const res = await fetch(`/api/admin/ledger?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCreateReversal = async () => {
    if (!selectedTxId || !reversalReason) return;

    try {
      const res = await fetch('/api/admin/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVERSAL',
          originalTransactionId: selectedTxId,
          reason: reversalReason,
        }),
      });

      if (res.ok) {
        alert('Reversal transaction created successfully!');
        setSelectedTxId(null);
        setReversalReason('');
        fetchTransactions();
      } else {
        const errData = await res.json();
        alert(`Reversal failed: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">System Ledger Browser & Reversals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect immutable double-entry ledger records across all members and wallets, or post compensating reversals.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={memberCodeFilter}
          onChange={(e) => setMemberCodeFilter(e.target.value)}
          placeholder="Filter by Member Code (e.g. FF100001)"
          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
        />
        <input
          type="text"
          value={walletCodeFilter}
          onChange={(e) => setWalletCodeFilter(e.target.value)}
          placeholder="Filter by Wallet Code (e.g. FF, CASH)"
          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
        />
        <button
          onClick={fetchTransactions}
          className="py-3 px-6 bg-indigo-500 hover:bg-indigo-600 font-bold text-white text-sm rounded-xl transition-all"
        >
          Apply Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading system ledger entries...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No transactions match filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tx ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{tx.id.substring(0, 10)}...</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {tx.member?.firstName} {tx.member?.lastName}{' '}
                      <span className="font-mono text-xs text-indigo-400">({tx.member?.memberCode})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-400">{tx.walletCode}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.direction === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">R {parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{tx.description}</td>
                    <td className="px-4 py-3">
                      {tx.type !== 'REVERSAL' && (
                        <button
                          onClick={() => setSelectedTxId(tx.id)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-500/20"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reversal Modal Dialog */}
      {selectedTxId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Confirm Reversal Transaction</h3>
            <p className="text-xs text-slate-400">
              Creating a compensating reversal transaction for Tx ID: <code className="text-indigo-400">{selectedTxId}</code>
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Reason for Reversal</label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="State the audit justification for this financial reversal..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedTxId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReversal}
                className="px-4 py-2 bg-rose-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Execute Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
