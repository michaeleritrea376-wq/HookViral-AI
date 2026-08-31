import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Check, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAccount } from '../types';

interface AirTmVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUpgradeSuccess: (user: any) => void;
}

export const AirTmVaultModal: React.FC<AirTmVaultModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [planId, setPlanId] = useState<'1year' | 'lifetime'>('1year');
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const CASHIER_EMAIL = 'michaeleritrea376@gmail.com';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CASHIER_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !transactionId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/airtm/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          planId,
          transactionId: transactionId.trim(),
          amount: planId === 'lifetime' ? 100 : 25,
          note,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit transaction');
      }

      setSuccessMessage(
        `Receipt submitted! Status: PENDING_VERIFICATION. Cashier (${CASHIER_EMAIL}) is reviewing transaction ${transactionId.trim()}. Your account will unlock upon approval.`
      );
      if (onUpgradeSuccess && data.user) {
        onUpgradeSuccess(data.user);
      }
    } catch (err: any) {
      alert(err.message || 'AirTM submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#09090b] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AirTM Cashier Verification
              </h2>
              <p className="text-xs text-slate-400">
                Official AirTM Manual Payment Gateway for HookViral AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Step 1: Cashier Information */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official AirTM Cashier Account
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 px-2.5 py-1 rounded transition border border-indigo-800/40"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-sm font-bold text-white select-all">
              {CASHIER_EMAIL}
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>• <strong>1-Year Pro:</strong> $25.00 USD</p>
              <p>• <strong>Lifetime Access:</strong> $100.00 USD</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Select Your Plan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlanId('1year')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    planId === '1year'
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  1-Year Pro ($25)
                </button>
                <button
                  type="button"
                  onClick={() => setPlanId('lifetime')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    planId === 'lifetime'
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Lifetime Founder ($100)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Your AirTM Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@airtm.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                AirTM Transaction Reference ID
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., TX-84729103"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              id="submit-airtm-tx-btn"
              type="submit"
              disabled={isSubmitting || !email || !transactionId}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Verifying with AirTM...' : 'Verify Transaction & Unlock Pro'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
