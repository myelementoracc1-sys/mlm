'use client';

import { useEffect, useState } from 'react';

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cap, setCap] = useState('');
  const [overflowDestinationCode, setOverflowDestinationCode] = useState('');

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/wallets');
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          name,
          description,
          cap: cap ? parseFloat(cap) : null,
          overflowDestinationCode: overflowDestinationCode ? overflowDestinationCode.toUpperCase() : null,
        }),
      });

      if (res.ok) {
        alert('Wallet definition saved successfully!');
        setCode('');
        setName('');
        setDescription('');
        setCap('');
        setOverflowDestinationCode('');
        fetchWallets();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Generic Wallet Definitions</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure active wallet definitions, optional transaction caps, and automatic overflow destinations.
        </p>
      </div>

      {/* Wallet Definition Form */}
      <form onSubmit={handleSaveWallet} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Add / Update Wallet Definition</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. FF, RIDE, CASH, PETROL_CARD"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Wallet Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fast Forward Wallet"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Optional Cap (ZAR)</label>
            <input
              type="number"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="e.g. 100.00"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Overflow Destination</label>
            <input
              type="text"
              value={overflowDestinationCode}
              onChange={(e) => setOverflowDestinationCode(e.target.value)}
              placeholder="e.g. CASH"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of wallet usage & limits"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
          />
        </div>

        <button
          type="submit"
          className="py-3 px-6 bg-indigo-500 hover:bg-indigo-600 font-bold text-white text-sm rounded-xl transition-all"
        >
          Save Wallet Definition
        </button>
      </form>

      {/* Wallets List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Active Wallet Definitions</h3>
        {loading ? (
          <p className="text-sm text-slate-400 py-4">Loading wallets...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wallets.map((w) => (
              <div key={w.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{w.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {w.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">{w.name}</h4>
                <p className="text-xs text-slate-400">{w.description || 'No description'}</p>
                <div className="pt-2 border-t border-slate-850 text-[11px] text-slate-300 space-y-1 font-mono">
                  <p>Cap: {w.cap ? `R ${parseFloat(w.cap).toFixed(2)}` : 'None (Uncapped)'}</p>
                  <p>Overflow: {w.overflowDestinationCode || 'None'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
