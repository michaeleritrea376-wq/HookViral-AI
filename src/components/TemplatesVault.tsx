import React from 'react';
import { X, BookOpen, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { VIRAL_TEMPLATES } from '../data/templates';
import { ViralTemplate } from '../types';

interface TemplatesVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ViralTemplate) => void;
}

export const TemplatesVault: React.FC<TemplatesVaultProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-[#09090b] p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                100M+ View Viral Hook Vault
              </h2>
              <p className="text-xs text-slate-400">
                Reverse-engineered proven hook frameworks from top-tier short-form creators.
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

        {/* Vault Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          {VIRAL_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 flex flex-col justify-between space-y-3 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tmpl.category}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {tmpl.viewsEstimate}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
                  {tmpl.title}
                </h3>

                <p className="text-xs text-slate-300 italic mt-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  "{tmpl.hookText}"
                </p>

                <div className="mt-2.5 text-[11px] text-slate-400">
                  <strong className="text-slate-300">0-3s Disruption:</strong> {tmpl.interruptTechnique}
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTemplate(tmpl);
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition border border-slate-800"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Blueprint into Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
