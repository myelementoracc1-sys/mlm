'use client';

import { useEffect, useState } from 'react';

export default function MemberDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [balances, setBalances] = useState<any>(null);
  const [phaseInfo, setPhaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, walletRes, phaseRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/member/wallets'),
          fetch('/api/member/phase'),
        ]);

        if (meRes.ok) setUser(await meRes.json());
        if (walletRes.ok) {
          const wData = await walletRes.json();
          setBalances(wData.balances);
        }
        if (phaseRes.ok) setPhaseInfo(await phaseRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400">Loading member dashboard...</div>;
  }

  const member = user?.member;

  return (
    <div className="space-y-8">
      {/* Welcome & Member ID Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Member Overview
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">
            Welcome back, {member?.firstName || 'Member'}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Fast Forward Code: <span className="font-mono text-emerald-400 font-bold">{member?.memberCode}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="text-right">
            <p className="text-xs text-slate-400">Current Phase</p>
            <p className="text-sm font-bold text-emerald-400">
              {phaseInfo?.currentPhase ? phaseInfo.currentPhase.name : 'Unconfigured Phase'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            ⭐
          </div>
        </div>
      </div>

      {/* Referral Link & Sponsor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Your Referral Code & Link
          </h3>
          <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-sm text-slate-200">
            <span className="flex-1 truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/register?sponsor=${member?.memberCode}` : member?.memberCode}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(member?.memberCode || '');
                alert('Sponsor code copied to clipboard!');
              }}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition-all"
            >
              Copy Code
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Sponsor Information
          </h3>
          {member?.sponsor ? (
            <div className="flex items-center space-x-3 text-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                {member.sponsor.firstName[0]}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {member.sponsor.firstName} {member.sponsor.lastName}
                </p>
                <p className="text-xs text-slate-400 font-mono">Code: {member.sponsor.memberCode}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No direct sponsor assigned (Direct Root Member)</p>
          )}
        </div>
      </div>

      {/* Real-time Wallet Balances */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Wallets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {balances &&
            Object.entries(balances).map(([code, data]: [string, any]) => (
              <div key={code} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                    {code}
                  </span>
                  {data.definition.cap && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Cap: R {data.definition.cap}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-slate-400">{data.definition.name}</h4>
                <p className="text-2xl font-extrabold text-white mt-1">
                  R {parseFloat(data.balance.toString()).toFixed(2)}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
