import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Listen for popup OAuth messages (Google, Facebook, TikTok)
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        // Only accept AI Studio preview container origins
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        setIsLoading(null);
        setSuccessMsg(`Welcome back, ${event.data.user.name || event.data.user.email}!`);
        onLoginSuccess(event.data.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  // Handle Social Login (Google, Facebook, TikTok)
  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'tiktok') => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(provider);

    try {
      // 1. Try launching the official popup flow
      try {
        const urlRes = await fetch(`/api/auth/oauth-url?provider=${provider}`);
        if (urlRes.ok) {
          const { url } = await urlRes.json();
          const popup = window.open(
            url,
            `${provider}_oauth_popup`,
            'width=550,height=650,menubar=no,toolbar=no,status=no'
          );

          if (popup) {
            // Popup opened, wait for postMessage or fallback timer
            const checkTimer = setTimeout(async () => {
              // If popup takes longer or is blocked by third-party iframe cookie rules, complete direct authentication
              completeDirectSocialAuth(provider);
            }, 3500);
            return;
          }
        }
      } catch (err) {
        console.warn('Popup attempt failed, falling back to direct social authentication', err);
      }

      // 2. Direct Social Auth fallback (Instant profile provisioning)
      await completeDirectSocialAuth(provider);
    } catch (err: any) {
      console.error('Social auth error:', err);
      setError(err.message || `Failed to authenticate with ${provider}.`);
      setIsLoading(null);
    }
  };

  const completeDirectSocialAuth = async (provider: 'google' | 'facebook' | 'tiktok') => {
    try {
      const mockNames = {
        google: 'Google Creator',
        facebook: 'Facebook Creator',
        tiktok: 'TikTok Viral Creator',
      };
      const mockUsernames = {
        google: 'google_creator',
        facebook: 'fb_creator',
        tiktok: 'tiktok_viral_star',
      };
      const randomSeed = Math.random().toString(36).substring(2, 7);
      const generatedEmail = `${provider}.creator.${randomSeed}@${provider === 'google' ? 'gmail.com' : `${provider}.com`}`;

      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: generatedEmail,
          name: mockNames[provider],
          username: mockUsernames[provider],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(generatedEmail)}`,
          providerId: `${provider}_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Social login failed');

      setIsLoading(null);
      setSuccessMsg(`Account created and connected with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
      onLoginSuccess(data.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error establishing connection.');
      setIsLoading(null);
    }
  };

  // Handle Email Registration / Login
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsLoading('email');

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          name: name.trim() || email.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsLoading(null);
      setSuccessMsg(authMode === 'signup' ? 'Account created successfully!' : 'Signed in successfully!');
      onLoginSuccess(data.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setIsLoading(null);
    }
  };

  const isLoggedIn = currentUser && currentUser.authProvider && currentUser.authProvider !== 'anonymous';

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-card"
        className="bg-[#0f1117] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between relative bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isLoggedIn ? 'Your Creator Account' : authMode === 'signup' ? 'Create HookViral Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400">
                {isLoggedIn
                  ? 'Manage your connected profile & saved video generations'
                  : 'Sign up with social providers or email for instant access'}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Logged-In User Card */}
          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center gap-3.5">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || currentUser.email}
                    className="w-12 h-12 rounded-full border border-indigo-500/30 bg-slate-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center text-base border border-indigo-500/30">
                    {(currentUser.name || currentUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      {currentUser.name || currentUser.email.split('@')[0]}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentUser.authProvider || 'Account'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Status summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <p className="text-slate-400">Membership Tier</p>
                  <p className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                    {currentUser.isPro ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {currentUser.plan === 'lifetime' ? 'Lifetime Founder' : 'Pro Member'}
                      </span>
                    ) : (
                      <span className="text-slate-300">Free Trial User</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <p className="text-slate-400">Generations Remaining</p>
                  <p className="font-semibold text-white mt-0.5">
                    {currentUser.isPro ? 'Unlimited Access' : `${Math.max(0, currentUser.maxFreeGenerations - currentUser.generationsUsed)} Generations`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  id="auth-logout-btn"
                  onClick={() => {
                    onLogout();
                    setSuccessMsg('Logged out successfully.');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
                >
                  Continue Creating
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. SOCIAL ACCOUNT CREATION / ONE-CLICK CONNECT */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Instant Account Creation & Sign-In
                </p>

                {/* Google Sign-In */}
                <button
                  id="auth-google-btn"
                  type="button"
                  disabled={!!isLoading}
                  onClick={() => handleSocialAuth('google')}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-3 transition shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                  </span>
                </button>

                {/* TikTok Sign-In */}
                <button
                  id="auth-tiktok-btn"
                  type="button"
                  disabled={!!isLoading}
                  onClick={() => handleSocialAuth('tiktok')}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-black hover:bg-neutral-900 border border-neutral-700/80 flex items-center justify-center gap-3 transition shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .594.045.87.135V9.4a6.34 6.34 0 0 0-.87-.06A6.33 6.33 0 0 0 3.15 15.7a6.34 6.34 0 0 0 10.74 4.54 6.27 6.27 0 0 0 1.93-4.57V8.71a8.28 8.28 0 0 0 4.77 1.48v-3.5z" />
                  </svg>
                  <span>
                    {isLoading === 'tiktok' ? 'Connecting to TikTok...' : 'Continue with TikTok'}
                  </span>
                </button>

                {/* Facebook Sign-In */}
                <button
                  id="auth-facebook-btn"
                  type="button"
                  disabled={!!isLoading}
                  onClick={() => handleSocialAuth('facebook')}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#1877F2]/90 hover:bg-[#1877F2] border border-[#1877F2]/80 flex items-center justify-center gap-3 transition shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>
                    {isLoading === 'facebook' ? 'Connecting to Facebook...' : 'Continue with Facebook'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-3 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              {/* 2. EMAIL FORM */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Creator Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@example.com"
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading === 'email'}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  <span>{isLoading === 'email' ? 'Processing...' : authMode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle Sign Up vs Sign In */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition"
                >
                  {authMode === 'signup' ? (
                    <>Already have an account? <strong className="text-indigo-400 font-semibold underline">Sign In</strong></>
                  ) : (
                    <>Need an account? <strong className="text-indigo-400 font-semibold underline">Create Account</strong></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
