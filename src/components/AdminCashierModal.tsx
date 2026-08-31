import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { AirTmSubmission } from '../types';

interface AdminCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionUpdated?: () => void;
}

export const AdminCashierModal: React.FC<AdminCashierModalProps> = ({
  isOpen,
  onClose,
  onSubmissionUpdated,
}) => {
  const [submissions, setSubmissions] = useState<AirTmSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING_VERIFICATION' | 'approved' | 'rejected'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/airtm/submissions');
      const data = await res.json();
      if (res.ok && data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (submissionId: string) => {
    setActionLoadingId(submissionId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/airtm/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve submission');
      }
      setMessage({ type: 'success', text: `Approved & unlocked account for ${data.submission?.email}` });
      fetchSubmissions();
      if (onSubmissionUpdated) onSubmissionUpdated();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    const reason = window.prompt('Reason for rejection (optional):', 'Transaction ID not found in AirTM ledger');
    if (reason === null) return; // cancelled

    setActionLoadingId(submissionId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/airtm/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject submission');
      }
      setMessage({ type: 'success', text: `Submission rejected for ${data.submission?.email}` });
      fetchSubmissions();
      if (onSubmissionUpdated) onSubmissionUpdated();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = submissions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'PENDING_VERIFICATION').length;

  return (
    <div
      id="admin-cashier-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#09090b] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  AirTM Cashier Review Portal
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Cashier: michaeleritrea376@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review pending manual payments, verify AirTM transaction IDs, and approve account unlocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubmissions}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Notifications */}
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-[10px] underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_VERIFICATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  statusFilter === 'PENDING_VERIFICATION'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pending Review ({pendingCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Rejected
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Cashier Ledger Protocol Active
            </div>
          </div>

          {/* Submissions List */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-slate-950 rounded-xl border border-slate-800">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                No AirTM submissions found in this view.
              </p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                When users submit their AirTM Transaction IDs, they will appear here under PENDING_VERIFICATION for cashier audit.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((item) => {
                const isPending = item.status === 'PENDING_VERIFICATION';
                const isApproved = item.status === 'approved';
                const isRejected = item.status === 'rejected';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.email}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isPending
                              ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                              : isApproved
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950/60 text-rose-400 border-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                          {item.planId === 'lifetime' ? '$100 Lifetime' : '$25 1-Year'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>
                          AirTM TX ID: <strong className="text-slate-200 font-mono select-all">{item.transactionId}</strong>
                        </span>
                        <span>
                          User ID: <span className="text-slate-400 font-mono">{item.userId}</span>
                        </span>
                        <span>
                          Submitted: {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-slate-400 italic">
                          Note: "{item.note}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === item.id ? 'Approving...' : 'Approve & Unlock Pro'}</span>
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 font-semibold text-xs border border-slate-800 hover:border-rose-800 transition active:scale-95"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {isApproved ? '✓ Verified & Unlocked' : '✕ Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
