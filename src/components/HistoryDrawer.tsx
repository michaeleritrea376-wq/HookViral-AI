import React from 'react';
import { X, History, ArrowRight, Trash2, Video } from 'lucide-react';
import { ViralHookPrompt } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ViralHookPrompt[];
  onSelectHook: (hook: ViralHookPrompt) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHook,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#09090b] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Generation History
              </h2>
              <p className="text-xs text-slate-400">
                {history.length} saved viral hook blueprints in this session.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition text-xs flex items-center gap-1 border border-slate-800"
                title="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-600 space-y-2">
              <Video className="w-8 h-8 text-slate-800 mx-auto" />
              <p className="text-xs">No generations yet. Create your first viral hook blueprint above!</p>
            </div>
          ) : (
            history.map((hook) => (
              <div
                key={hook.id}
                onClick={() => {
                  onSelectHook(hook);
                  onClose();
                }}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {hook.hookAngle.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {new Date(hook.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
                  {hook.hookTitle}
                </h4>

                <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                  "{hook.hookSpokenText}"
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-indigo-400">
                  <span className="text-slate-500">Topic: {hook.topic}</span>
                  <span className="flex items-center gap-1 font-semibold group-hover:translate-x-1 transition">
                    Load Studio Blueprint <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
