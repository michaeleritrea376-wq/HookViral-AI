import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Crown,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PAYMENT_PLANS } from '../data/templates';
import { UserAccount } from '../types';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUpgradeSuccess: (updatedUser: any) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'1year' | 'lifetime'>('1year');
  const [paymentTab, setPaymentTab] = useState<'stripe' | 'airtm'>('stripe');
  
  // Stripe state
  const [stripeEmail, setStripeEmail] = useState(user.email || 'creator@hookviral.ai');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // AirTM state
  const [airtmEmail, setAirtmEmail] = useState(user.email || '');
  const [airtmTxId, setAirtmTxId] = useState('');
  const [airtmNote, setAirtmNote] = useState('');
  const [isSubmittingAirtm, setIsSubmittingAirtm] = useState(false);
  const [airtmSuccessMsg, setAirtmSuccessMsg] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const AIRTM_CASHIER = 'michaeleritrea376@gmail.com';

  if (!isOpen) return null;

  const currentPlan = PAYMENT_PLANS.find((p) => p.id === selectedPlan) || PAYMENT_PLANS[0];

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCopyCashierEmail = () => {
    navigator.clipboard.writeText(AIRTM_CASHIER);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    setStripeError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          userEmail: stripeEmail,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start Stripe checkout');
      }

      // Classic Stripe Hosted Checkout Link redirect (session.url)
      const targetUrl = data.url || data.checkoutUrl;
      if (targetUrl) {
        window.location.href = targetUrl;
        return;
      }

      // If simulated demo link is returned for preview
      if (data.sessionId) {
        window.location.href = `/?payment=success&session_id=${data.sessionId}&plan=${selectedPlan}`;
      }
    } catch (err: any) {
      setStripeError(err.message || 'Stripe error occurred');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleAirtmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!airtmEmail || !airtmTxId) return;

    setIsSubmittingAirtm(true);
    setAirtmSuccessMsg(null);

    try {
      const res = await fetch('/api/airtm/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: airtmEmail,
          planId: selectedPlan,
          transactionId: airtmTxId,
          amount: currentPlan.price,
          note: airtmNote,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit AirTM payment');
      }

      setAirtmSuccessMsg(
        `Receipt submitted! Status: PENDING_VERIFICATION. Cashier (${AIRTM_CASHIER}) has been notified to verify Transaction ID ${airtmTxId.trim()} and approve your account.`
      );
      if (onUpgradeSuccess && data.user) {
        onUpgradeSuccess(data.user);
      }
    } catch (err: any) {
      alert(err.message || 'AirTM submission failed');
    } finally {
      setIsSubmittingAirtm(false);
    }
  };

  return (
    <div
      id="paywall-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-8">
        {/* Top Header */}
        <div className="bg-[#09090b] p-6 border-b border-slate-800 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Upgrade to HookViral AI Pro
              </h2>
              <p className="text-xs text-slate-400">
                Unlock unlimited high-retention viral prompts and Fal AI video rendering.
              </p>
            </div>
          </div>

          <button
            id="close-paywall-modal"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Plan Comparison Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                Free Plan
              </span>
              <span>Hook & Script Creation Only</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
                Pro & Lifetime
              </span>
              <span>Unlimited Creation + Direct GPU Video Rendering</span>
            </div>
          </div>

          {/* Plan Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAYMENT_PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-5 rounded-xl border cursor-pointer transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white shadow-sm">
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white text-base">{plan.name}</h3>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-black text-white">${plan.price}</span>
                      <span className="text-xs text-slate-400 font-medium">/ {plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                    {plan.features.slice(0, 4).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentTab('stripe')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                  paymentTab === 'stripe'
                    ? 'border-indigo-500 text-white bg-slate-900/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>Credit Card (Stripe)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('airtm')}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                  paymentTab === 'airtm'
                    ? 'border-indigo-500 text-white bg-slate-900/50'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>AirTM Manual Cashier</span>
              </button>
            </div>

            {/* TAB 1: Stripe Checkout */}
            {paymentTab === 'stripe' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Your Billing Email
                  </label>
                  <input
                    type="email"
                    value={stripeEmail}
                    onChange={(e) => setStripeEmail(e.target.value)}
                    placeholder="creator@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-Bit SSL Encrypted Checkout</span>
                  </div>
                  <span className="font-bold text-white">
                    Total: ${currentPlan.price}.00 USD
                  </span>
                </div>

                {stripeError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2 rounded">
                    {stripeError}
                  </p>
                )}

                <button
                  id="stripe-checkout-btn"
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={isProcessingStripe}
                  className="w-full py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition active:scale-[0.99]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessingStripe
                      ? 'Processing Secure Checkout...'
                      : `Pay $${currentPlan.price} with Stripe & Unlock Pro`}
                  </span>
                </button>
              </div>
            )}

            {/* TAB 2: AirTM Verification */}
            {paymentTab === 'airtm' && (
              <form onSubmit={handleAirtmSubmit} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400">AirTM Cashier Email:</span>
                    <button
                      type="button"
                      onClick={handleCopyCashierEmail}
                      className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50 transition"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white font-bold bg-slate-950 p-2.5 rounded select-all border border-slate-800">
                    {AIRTM_CASHIER}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1. Send <strong>${currentPlan.price} USD</strong> to <strong>{AIRTM_CASHIER}</strong> on AirTM.<br />
                    2. Paste your AirTM Transaction Reference ID below for instant unlock.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Your AirTM Email
                    </label>
                    <input
                      type="email"
                      required
                      value={airtmEmail}
                      onChange={(e) => setAirtmEmail(e.target.value)}
                      placeholder="your.email@airtm.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      required
                      value={airtmTxId}
                      onChange={(e) => setAirtmTxId(e.target.value)}
                      placeholder="e.g. TX-98432176"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {airtmSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{airtmSuccessMsg}</span>
                  </div>
                )}

                <button
                  id="airtm-verify-btn"
                  type="submit"
                  disabled={isSubmittingAirtm || !airtmEmail || !airtmTxId}
                  className="w-full py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmittingAirtm
                      ? 'Verifying AirTM Transaction...'
                      : `Verify AirTM ($${currentPlan.price}) & Unlock`}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
