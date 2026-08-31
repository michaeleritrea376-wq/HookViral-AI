import React from 'react';
import { Sparkles, Crown, Zap, History, BookOpen, ShieldCheck, User, LogIn } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  user: UserAccount;
  onOpenPaywall: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenAirTm: () => void;
  onOpenAuth?: () => void;
  onOpenAdminCashier?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenPaywall,
  onOpenTemplates,
  onOpenHistory,
  onOpenAirTm,
  onOpenAuth,
  onOpenAdminCashier,
}) => {
  const remaining = user.isPro ? 'Unlimited' : Math.max(0, user.maxFreeGenerations - user.generationsUsed);
  const isLoggedIn = user && user.authProvider && user.authProvider !== 'anonymous';

  return (
    <header id="app-navbar" className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-slate-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-500/20">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                HookViral<span className="text-indigo-500">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                3.7 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Viral Hooks & Fal AI Video Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Cashier Review Portal shortcut */}
          {onOpenAdminCashier && (
            <button
              id="nav-admin-cashier-btn"
              onClick={onOpenAdminCashier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-300 hover:text-amber-100 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 transition"
              title="AirTM Cashier Review Portal (michaeleritrea376@gmail.com)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cashier Portal</span>
            </button>
          )}

          {/* Viral Vault Library Button */}
          <button
            id="nav-vault-btn"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">100M+ Vault</span>
          </button>

          {/* History Button */}
          <button
            id="nav-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Account Profile / Social Sign-In Button */}
          {onOpenAuth && (
            <button
              id="nav-auth-btn"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                isLoggedIn
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-indigo-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
              title={isLoggedIn ? `Account: ${user.name || user.email}` : 'Sign in with Google, TikTok, Facebook'}
            >
              {isLoggedIn && user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-4 h-4 rounded-full" />
              ) : (
                <User className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden sm:inline">
                {isLoggedIn ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Sign In'}
              </span>
            </button>
          )}

          {/* Trial / Pro Badge */}
          {user.isPro ? (
            <div
              id="user-pro-badge"
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3.5 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                {user.plan === 'lifetime' ? 'Lifetime Founder' : 'Pro Active'}
              </span>
            </div>
          ) : (
            <div
              id="user-trial-counter"
              className="bg-slate-900 border border-slate-800 rounded-full px-3 sm:px-3.5 py-1.5 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${user.airtmStatus === 'PENDING_VERIFICATION' ? 'bg-amber-500 animate-ping' : remaining === 0 ? 'bg-rose-500' : 'bg-green-500'}`} />
              <span className="text-xs font-medium text-slate-300">
                {user.airtmStatus === 'PENDING_VERIFICATION' ? (
                  <span className="text-amber-300 font-bold">AirTM Pending</span>
                ) : (
                  <>
                    <strong className="text-white font-bold">{remaining}</strong> / 3 Free
                  </>
                )}
              </span>
            </div>
          )}

          {/* Upgrade CTA Button */}
          {!user.isPro ? (
            <button
              id="nav-upgrade-btn"
              onClick={onOpenPaywall}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </button>
          ) : (
            <button
              id="nav-manage-plan-btn"
              onClick={onOpenPaywall}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Plan Details</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
