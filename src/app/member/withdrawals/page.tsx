'use client';

export default function MemberWithdrawalsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Cash Wallet Withdrawals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage payout requests and review historical withdrawal disbursements.
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-4">
        <div className="flex items-center space-x-3 text-amber-400">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
          <h3 className="text-lg font-bold">Withdrawals Currently Disabled / Unconfigured</h3>
        </div>

        <p className="text-sm leading-relaxed text-amber-200/80">
          In accordance with strict financial compliance requirements, cash withdrawal requests remain disabled until all withdrawal business parameters are officially confirmed and configured by system administrators.
        </p>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 text-xs font-mono space-y-2 text-slate-300">
          <p className="font-bold text-amber-400 uppercase tracking-wider">Unconfirmed Business Rules Pending Configuration:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Minimum & Maximum single transaction limits</li>
            <li>Processing fee schedule & percentage deductions</li>
            <li>Administrative approval workflow requirements</li>
            <li>Supported banking & electronic payout channels</li>
          </ul>
        </div>

        <p className="text-xs text-amber-300/70">
          All accumulated funds remain securely held in your immutable ledger wallet balances.
        </p>
      </div>

      {/* Disabled Request Form Mockup */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 opacity-50 pointer-events-none">
        <h3 className="text-lg font-bold text-white">Submit Withdrawal Request</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Select Wallet</label>
            <input type="text" disabled value="CASH (Cash Wallet)" className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount (ZAR)</label>
            <input type="number" disabled placeholder="0.00" className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm" />
          </div>
        </div>
        <button disabled className="py-3 px-6 bg-slate-800 text-slate-500 font-bold rounded-xl w-full">
          Withdrawal System Disabled
        </button>
      </div>
    </div>
  );
}
