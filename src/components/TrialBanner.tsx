import React from 'react';
import { Sparkles, Lock, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { UserAccount } from '../types';

interface TrialBannerProps {
  user: UserAccount;
  onOpenPaywall: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ user, onOpenPaywall }) => {
  if (user.isPro) {
    return (
      <div id="pro-active-banner" className="bg-[#0c0c0e] border-b border-slate-800/80 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-semibold">HookViral AI Pro Active</strong> — Unlimited Gemini 3.7 Flash Hook Creation & Fal AI GPU Video Rendering unlocked ({user.plan === 'lifetime' ? 'Lifetime Access' : '1-Year Pro'}).
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-0.5 rounded-full">
            VIP Priority GPU Active
          </span>
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, user.maxFreeGenerations - user.generationsUsed);
  const isLocked = remaining === 0;
  const isPendingAirtm = user.airtmStatus === 'PENDING_VERIFICATION';

  return (
    <div
      id="trial-status-banner"
      className={`border-b py-2.5 px-4 transition-colors ${
        isPendingAirtm
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          : isLocked
          ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
          : 'bg-[#0c0c0e] border-slate-800/80 text-slate-300'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          {isPendingAirtm ? (
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 animate-pulse">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : isLocked ? (
            <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          )}
          <span>
            {isPendingAirtm ? (
              <span>
                <strong className="text-white font-semibold">AirTM Verification Pending:</strong> Cashier (michaeleritrea376@gmail.com) is reviewing your transaction ({user.pendingTransactionId || 'TX Submitted'}). Account remains locked until cashier verification.
              </span>
            ) : isLocked ? (
              <span className="font-semibold text-rose-200">
                Free creation limit reached ({user.generationsUsed}/{user.maxFreeGenerations} used). Upgrade to Pro for unlimited viral creation & direct GPU video rendering.
              </span>
            ) : (
              <span>
                <strong className="text-white font-semibold">Free Tier (Creation Only):</strong> You have <span className="text-indigo-400 font-bold">{remaining} free creation session{remaining !== 1 ? 's' : ''}</span> remaining. Upgrade to Pro for GPU video rendering.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicators */}
          <div className="flex items-center gap-1.5" title={`${user.generationsUsed} of ${user.maxFreeGenerations} creation sessions used`}>
            {Array.from({ length: user.maxFreeGenerations || 3 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx < user.generationsUsed
                    ? 'bg-indigo-500 shadow-xs shadow-indigo-500/50'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <button
            id="trial-upgrade-btn"
            onClick={onOpenPaywall}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{isPendingAirtm ? 'Check Paywall Status' : isLocked ? 'Upgrade to Pro ($25)' : 'Unlock GPU Rendering'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
