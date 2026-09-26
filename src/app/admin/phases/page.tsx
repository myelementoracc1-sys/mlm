'use client';

import { useEffect, useState } from 'react';

export default function AdminPhasesPage() {
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [ordering, setOrdering] = useState(1);
  const [qualificationThreshold, setQualificationThreshold] = useState('');
  const [benefitsDescription, setBenefitsDescription] = useState('');

  const fetchPhases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/phases');
      if (res.ok) {
        const data = await res.json();
        setPhases(data.phases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const handleSavePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ordering: Number(ordering),
          qualificationThreshold: parseFloat(qualificationThreshold),
          qualificationMetric: 'ACCUMULATED_EARNINGS',
          benefitsDescription,
        }),
      });

      if (res.ok) {
        alert('Phase definition saved successfully!');
        setName('');
        setOrdering(phases.length + 1);
        setQualificationThreshold('');
        setBenefitsDescription('');
        fetchPhases();
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
        <h1 className="text-2xl font-bold text-white">Progression Phase Definitions</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure progression levels, orderings, qualification thresholds, and associated benefits.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSavePhase} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Add Phase Definition</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phase Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Silver Tier"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Ordering Index</label>
            <input
              type="number"
              required
              value={ordering}
              onChange={(e) => setOrdering(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Threshold (ZAR)</label>
            <input
              type="number"
              required
              value={qualificationThreshold}
              onChange={(e) => setQualificationThreshold(e.target.value)}
              placeholder="e.g. 500.00"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Benefits Description</label>
          <input
            type="text"
            value={benefitsDescription}
            onChange={(e) => setBenefitsDescription(e.target.value)}
            placeholder="e.g. 5% Bonus on level 1 rides"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
          />
        </div>

        <button
          type="submit"
          className="py-3 px-6 bg-indigo-500 hover:bg-indigo-600 font-bold text-white text-sm rounded-xl transition-all"
        >
          Save Phase Definition
        </button>
      </form>

      {/* Active Phases List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Configured Progression Phases</h3>
        {loading ? (
          <p className="text-sm text-slate-400 py-4">Loading phase definitions...</p>
        ) : phases.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 italic">No phase definitions configured yet.</p>
        ) : (
          <div className="space-y-3">
            {phases.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-indigo-400 font-mono">#{p.ordering}</span>{' '}
                  <span className="font-bold text-white ml-2">{p.name}</span>
                  <p className="text-xs text-slate-400 mt-1">{p.benefitsDescription || 'No description'}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs text-slate-400">Threshold</p>
                  <p className="text-emerald-400 font-bold">R {parseFloat(p.qualificationThreshold).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
