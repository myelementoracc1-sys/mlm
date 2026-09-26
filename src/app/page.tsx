import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            FF
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">Fast Forward</h1>
            <p className="text-xs text-slate-400">MLM & Referral Rewards Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg shadow-md hover:shadow-emerald-500/20 transition-all"
          >
            Register Account
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
          <span>⚡ Configurable Multi-Level Compensation & Double-Entry Ledger (ZAR)</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Next-Generation Referral Rewards & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Genealogy Engine</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed">
          Fast Forward delivers high-performance, deterministic compensation processing, multi-wallet allocations, versioned rules engine, and auditable double-entry accounting built for scale.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/login"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-center"
          >
            Access Member Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all text-center"
          >
            Admin Management Console
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-4">
              💼
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Immutable Ledger</h3>
            <p className="text-sm text-slate-400">
              Wallet balances derived deterministically from audit-proof double-entry transaction history. No freely edited numbers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold mb-4">
              🧬
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Matrix & Sponsorship</h3>
            <p className="text-sm text-slate-400">
              Separates sponsorship genealogy from matrix placements. Flexible N-wide matrix configuration with spillover safety boundaries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold mb-4">
              🔌
            </div>
            <h3 className="font-bold text-lg text-white mb-2">E-Hailing Integration API</h3>
            <p className="text-sm text-slate-400">
              Clean API service boundary for external ride completions, driver subscriptions, and referral activities with full idempotency.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Fast Forward (FF). All rights reserved.
      </footer>
    </div>
  );
}
