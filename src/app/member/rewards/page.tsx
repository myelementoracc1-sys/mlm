'use client';

import { useEffect, useState } from 'react';

export default function MemberRewardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/member/rewards');
        if (res.ok) {
          const data = await res.json();
          setAwards(data.awards);
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
    return <div className="p-8 text-slate-400">Loading reward awards...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Commissions & Reward Breakdown</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete audit history of earned reward events with rule & wallet breakdown explanations.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {awards.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No commission awards recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {awards.map((award) => {
              let breakdown = [];
              try {
                breakdown = JSON.parse(award.walletBreakdownJson);
              } catch {
                breakdown = [];
              }

              return (
                <div key={award.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {award.rewardEvent?.eventType}
                      </span>
                      <p className="text-sm font-semibold text-white mt-1">
                        Ref: <span className="font-mono text-slate-300">{award.rewardEvent?.externalReference}</span> ({award.rewardEvent?.sourceSystem})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Awarded</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        R {parseFloat(award.amount.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Genealogy Depth Level:</span>{' '}
                      <span className="font-semibold text-white">Level {award.genealogyLevel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Monetary Basis:</span>{' '}
                      <span className="font-semibold text-white">
                        R {parseFloat(award.rewardEvent?.monetaryBasis || '0').toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Awarded Date:</span>{' '}
                      <span className="font-semibold text-white">
                        {new Date(award.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Wallet Breakdown Pills */}
                  <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-400 mr-2">Wallet Allocations:</span>
                    {breakdown.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200"
                      >
                        {item.walletCode}: <span className="text-emerald-400 font-bold">R {parseFloat(item.cappedAmount).toFixed(2)}</span>
                        {item.isCapped && <span className="text-amber-400 text-[10px] ml-1">(Capped)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
