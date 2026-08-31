import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { TrialBanner } from './components/TrialBanner';
import { GeneratorForm } from './components/GeneratorForm';
import { HookResultCard } from './components/HookResultCard';
import { FalVideoStudio } from './components/FalVideoStudio';
import { PaywallModal } from './components/PaywallModal';
import { TemplatesVault } from './components/TemplatesVault';
import { AirTmVaultModal } from './components/AirTmVaultModal';
import { AdminCashierModal } from './components/AdminCashierModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AuthModal } from './components/AuthModal';
import { UserAccount, ViralHookPrompt, ViralTemplate } from './types';
import { Sparkles, Video, CheckCircle2, UserCheck } from 'lucide-react';

const INITIAL_USER: UserAccount = {
  id: 'creator-session',
  email: 'creator@hookviral.ai',
  name: 'Guest Creator',
  authProvider: 'anonymous',
  plan: 'free',
  generationsUsed: 0,
  maxFreeGenerations: 3,
  isPro: false,
  totalVideosRendered: 0,
  airtmStatus: 'none',
};

export default function App() {
  const [user, setUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('hookviral_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USER;
  });

  const [activeHook, setActiveHook] = useState<ViralHookPrompt | null>(null);
  const [history, setHistory] = useState<ViralHookPrompt[]>(() => {
    const saved = localStorage.getItem('hookviral_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Fal AI Video Studio state
  const [falPrompt, setFalPrompt] = useState<string>('');
  const [falAspectRatio, setFalAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  
  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAirTmOpen, setIsAirTmOpen] = useState(false);
  const [isAdminCashierOpen, setIsAdminCashierOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hookviral_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hookviral_history', JSON.stringify(history));
  }, [history]);

  // Sync user status from backend
  const refreshUserStatus = () => {
    fetch(`/api/user/status?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser((prev) => ({
            ...prev,
            generationsUsed: data.user.generationsUsed ?? prev.generationsUsed,
            isPro: data.user.isPro ?? prev.isPro,
            plan: data.user.plan ?? prev.plan,
            airtmStatus: data.user.airtmStatus ?? prev.airtmStatus,
            pendingTransactionId: data.user.pendingTransactionId ?? prev.pendingTransactionId,
          }));
        }
      })
      .catch((e) => console.warn('Could not sync user status:', e));
  };

  useEffect(() => {
    refreshUserStatus();

    // Check for Stripe Checkout return URL params
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    const plan = (params.get('plan') as any) || '1year';

    if (payment === 'success' && sessionId) {
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          planId: plan,
          userId: user.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser((prev) => ({
              ...prev,
              isPro: true,
              plan: data.user.plan || plan,
            }));
            setWelcomeBanner('🎉 Stripe payment verified! Pro access unlocked.');
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            // Clean URL query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch((e) => console.error('Verification error:', e));
    }
  }, []);

  const isLocked = !user.isPro && user.generationsUsed >= user.maxFreeGenerations;

  const handleGenerate = async (formData: {
    topic: string;
    niche: string;
    platform: any;
    hookAngle: any;
    vibe: any;
  }) => {
    if (isLocked) {
      setIsPaywallOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setUser((prev) => ({ ...prev, generationsUsed: 3 }));
          setIsPaywallOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate viral hook.');
      }

      if (data.hook) {
        setActiveHook(data.hook);
        setHistory((prev) => [data.hook, ...prev.filter((h) => h.id !== data.hook.id)]);
        setFalPrompt(data.hook.falAiVideoPrompt);
        setFalAspectRatio(data.hook.suggestedAspectRatio || '9:16');
      }

      if (data.user) {
        setUser((prev) => ({
          ...prev,
          generationsUsed: data.user.generationsUsed,
          isPro: data.user.isPro,
          plan: data.user.plan,
          airtmStatus: data.user.airtmStatus ?? prev.airtmStatus,
        }));
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenError(err.message || 'Error occurred while generating viral hook.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToFalRender = (promptText: string, ratio: '9:16' | '16:9' | '1:1') => {
    setFalPrompt(promptText);
    setFalAspectRatio(ratio);
    const studioEl = document.getElementById('fal-video-studio');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTemplate = (template: ViralTemplate) => {
    handleGenerate({
      topic: template.hookText,
      niche: template.niche,
      platform: 'tiktok',
      hookAngle: 'curiosity_gap',
      vibe: 'high_energy',
    });
  };

  const handleUpgradeSuccess = (updatedUser: any) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUser,
      isPro: updatedUser.isPro ?? prev.isPro,
      plan: updatedUser.plan || prev.plan,
      airtmStatus: updatedUser.airtmStatus ?? prev.airtmStatus,
      pendingTransactionId: updatedUser.pendingTransactionId ?? prev.pendingTransactionId,
    }));
    if (updatedUser.isPro) {
      confetti({ particleCount: 80, spread: 70 });
      setIsPaywallOpen(false);
      setIsAirTmOpen(false);
    }
  };

  const handleLoginSuccess = (authenticatedUser: UserAccount) => {
    setUser(authenticatedUser);
    localStorage.setItem('hookviral_user', JSON.stringify(authenticatedUser));
    setWelcomeBanner(`✨ Welcome, ${authenticatedUser.name || authenticatedUser.email}! You're logged in with ${authenticatedUser.authProvider?.toUpperCase() || 'Account'}.`);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  };

  const handleLogout = () => {
    setUser(INITIAL_USER);
    localStorage.removeItem('hookviral_user');
    setWelcomeBanner('👋 You have been logged out.');
  };

  const handleResetCredits = () => {
    fetch('/api/user/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json())
      .then(() => {
        setUser(INITIAL_USER);
        localStorage.removeItem('hookviral_user');
      });
  };

  const handleQuickUnlockPro = () => {
    fetch('/api/user/upgrade-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, plan: 'lifetime', email: user.email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          handleUpgradeSuccess(data.user);
        }
      });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-50 font-sans selection:bg-indigo-600 selection:text-white flex flex-col relative">
      {/* Background Dot Grid Layer */}
      <div
        className="fixed inset-0 opacity-15 pointer-events-none bg-dot-grid -z-10"
        aria-hidden="true"
      />

      {/* Navigation */}
      <Navbar
        user={user}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAirTm={() => setIsAirTmOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminCashier={() => setIsAdminCashierOpen(true)}
      />

      {/* Welcome / Payment Toast */}
      {welcomeBanner && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-2 w-full justify-between">
            <span className="font-semibold">{welcomeBanner}</span>
            <button
              onClick={() => setWelcomeBanner(null)}
              className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Trial Status Bar */}
      <TrialBanner user={user} onOpenPaywall={() => setIsPaywallOpen(true)} />

      {/* Social Sign-In CTA Strip for Unregistered Users */}
      {(!user.authProvider || user.authProvider === 'anonymous') && (
        <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Create account to save your generated video prompts & unlock features:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 transition"
              >
                <span>Google</span>
              </button>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 transition"
              >
                <span>TikTok</span>
              </button>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-200 transition"
              >
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Error Notification */}
        {genError && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm flex items-center justify-between shadow-lg">
            <span>{genError}</span>
            <button
              onClick={() => setGenError(null)}
              className="text-xs bg-rose-900/80 px-2.5 py-1 rounded hover:bg-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 1: Interactive Viral Hook Studio (Gemini 3.7 Flash) */}
        <section>
          <GeneratorForm
            onGenerate={handleGenerate}
            isLoading={isGenerating}
            isLocked={isLocked}
            onOpenPaywall={() => setIsPaywallOpen(true)}
          />
        </section>

        {/* Section 2: Generated Viral Hook Blueprint Results */}
        {activeHook && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400">
                  Generated Blueprint
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Engine: Gemini 3.7 Flash
              </span>
            </div>

            <HookResultCard
              hook={activeHook}
              user={user}
              onOpenPaywall={() => setIsPaywallOpen(true)}
              onSendToFalRender={handleSendToFalRender}
            />
          </section>
        )}

        {/* Section 3: Fal AI Direct Video Render Studio */}
        <section>
          <FalVideoStudio
            initialPrompt={falPrompt}
            initialAspectRatio={falAspectRatio}
            user={user}
            onOpenPaywall={() => setIsPaywallOpen(true)}
            onRenderSuccess={(job) => {
              setUser((prev) => ({
                ...prev,
                totalVideosRendered: prev.totalVideosRendered + 1,
              }));
            }}
          />
        </section>
      </main>

      {/* Footer styled according to Elegant Dark aesthetic */}
      <footer className="h-auto sm:h-14 border-t border-slate-800 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between bg-[#09090b] text-[11px] text-slate-500 font-medium gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            API STATUS: <span className="text-green-500 font-bold">OPERATIONAL</span>
          </span>
          <span className="hidden sm:inline w-px h-3 bg-slate-800" />
          <span className="flex items-center gap-1">
            FAL AI: <span className="text-indigo-400 font-mono italic">87eaec62...f5f3</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <button
            onClick={() => setIsAdminCashierOpen(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition"
          >
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span>AirTM Cashier Portal (michaeleritrea376@gmail.com)</span>
          </button>

          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Stripe Secure
          </span>

          {/* Quick Testing Controls */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
            <button
              onClick={handleResetCredits}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition text-[10px]"
              title="Reset free trial credits to 3"
            >
              Reset 3 Credits
            </button>
            <button
              onClick={handleQuickUnlockPro}
              className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 transition text-[10px] font-semibold"
              title="Instantly test Pro unlocked state"
            >
              Unlock Pro
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        user={user}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      <TemplatesVault
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <AirTmVaultModal
        isOpen={isAirTmOpen}
        onClose={() => setIsAirTmOpen(false)}
        user={user}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      <AdminCashierModal
        isOpen={isAdminCashierOpen}
        onClose={() => setIsAdminCashierOpen(false)}
        onSubmissionUpdated={refreshUserStatus}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHook={(hook) => {
          setActiveHook(hook);
          setFalPrompt(hook.falAiVideoPrompt);
          setFalAspectRatio(hook.suggestedAspectRatio || '9:16');
        }}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}

