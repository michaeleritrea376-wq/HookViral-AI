import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Sliders,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  Cpu,
  Flame,
} from 'lucide-react';
import { HookAngle, PlatformType, VideoVibe } from '../types';

interface GeneratorFormProps {
  onGenerate: (data: {
    topic: string;
    niche: string;
    platform: PlatformType;
    hookAngle: HookAngle;
    vibe: VideoVibe;
  }) => void;
  isLoading: boolean;
  isLocked: boolean;
  onOpenPaywall: () => void;
}

const NICHES = [
  'AI & SaaS Tools',
  'E-commerce & Dropshipping',
  'Personal Finance & Wealth',
  'Fitness & High Performance',
  'Creator Economy & Editing',
  'Beauty, Skincare & Fashion',
  'Real Estate & Luxury Lifestyle',
  'Storytime & Psychology',
  'Life Hacks & Tech Gadgets',
  'Agency & High-Ticket B2B',
];

const HOOK_ANGLES: { id: HookAngle; label: string; desc: string; icon: string }[] = [
  {
    id: 'curiosity_gap',
    label: 'Curiosity Gap',
    desc: 'Withholds key detail to force full watch duration',
    icon: '🕵️',
  },
  {
    id: 'shocking_stat',
    label: 'Shocking Stat',
    desc: 'Unbelievable metric or high-stakes number',
    icon: '⚡',
  },
  {
    id: 'controversial_take',
    label: 'Controversial Myth Buster',
    desc: 'Attacks common advice & sparks comment debate',
    icon: '🔥',
  },
  {
    id: 'visual_transformation',
    label: 'Visual Transformation',
    desc: 'Before/After dramatic contrast in first frame',
    icon: '✨',
  },
  {
    id: 'secret_reveal',
    label: 'Leaked Secret Formula',
    desc: 'Exposing hidden industry blueprints',
    icon: '🔓',
  },
  {
    id: 'money_hack',
    label: 'High-ROI Wealth Hack',
    desc: 'Financial or time leverage loophole',
    icon: '💰',
  },
  {
    id: 'relatable_struggle',
    label: 'Relatable Pain Point',
    desc: 'Instant emotional resonance with viewer agony',
    icon: '🤯',
  },
  {
    id: 'storytelling',
    label: 'High-Stakes Story Intro',
    desc: 'Starts in the middle of extreme dramatic action',
    icon: '🎬',
  },
];

const PLATFORMS: { id: PlatformType; label: string; ratio: string }[] = [
  { id: 'tiktok', label: 'TikTok (9:16)', ratio: '9:16' },
  { id: 'reels', label: 'Instagram Reels (9:16)', ratio: '9:16' },
  { id: 'shorts', label: 'YouTube Shorts (9:16)', ratio: '9:16' },
  { id: 'ads', label: 'Paid Video Ads (9:16)', ratio: '9:16' },
];

const VIBES: { id: VideoVibe; label: string; color: string }[] = [
  { id: 'high_energy', label: 'High Energy & Hyper-Kinetic', color: 'bg-indigo-500' },
  { id: 'dark_luxury', label: 'Dark Luxury & High Status', color: 'bg-slate-300' },
  { id: 'cinematic_moody', label: 'Cinematic Moody & Atmospheric', color: 'bg-purple-500' },
  { id: 'urgent_breaking', label: 'Urgent Breaking News Alert', color: 'bg-rose-500' },
  { id: 'hypnotic_aesthetic', label: 'Hypnotic ASMR / Visual Dopamine', color: 'bg-teal-400' },
  { id: 'minimalist_clean', label: 'Clean Tech & Minimalist Modern', color: 'bg-sky-400' },
];

const QUICK_IDEAS = [
  'How a 19yo built a $30k/mo Shopify store selling 1 kitchen gadget',
  'The secret AI prompting trick that replaces an entire video editing agency',
  'Why drinking coffee in the first 90 minutes ruins your dopamine receptors',
  '3 psychological triggers that make customers buy immediately without thinking',
  'The dark truth behind viral TikTok dropshipping accounts in 2026',
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onGenerate,
  isLoading,
  isLocked,
  onOpenPaywall,
}) => {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('AI & SaaS Tools');
  const [platform, setPlatform] = useState<PlatformType>('tiktok');
  const [hookAngle, setHookAngle] = useState<HookAngle>('curiosity_gap');
  const [vibe, setVibe] = useState<VideoVibe>('high_energy');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onOpenPaywall();
      return;
    }
    if (!topic.trim()) return;
    onGenerate({ topic, niche, platform, hookAngle, vibe });
  };

  const handleApplyQuickIdea = (idea: string) => {
    setTopic(idea);
  };

  return (
    <div id="generator-form-card" className="bg-[#0c0c0e] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              AI Viral Hook & Video Prompt Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Engineered with Gemini 3.7 Flash for 0-3s pattern interrupts, camera physics, and direct Fal AI rendering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showAdvanced ? 'Simple Mode' : 'Refine Angle & Tone'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Topic Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="topic-input" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video Concept / Topic</span>
            </label>
            <span className="text-[11px] text-slate-600 font-mono">Specific idea or product</span>
          </div>

          <div className="relative">
            <textarea
              id="topic-input"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your video idea (e.g., A futuristic sneakers reveal with neon lightning, or how a solo founder scaled an AI tool to $50k/mo)..."
              className="w-full h-32 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-700 outline-none resize-none leading-relaxed transition"
            />
          </div>

          {/* Quick Idea Starters */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-indigo-400" /> Fast Starters:
            </span>
            {QUICK_IDEAS.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyQuickIdea(idea)}
                className="text-[11px] px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 border border-slate-800 text-slate-400 hover:text-slate-200 transition truncate max-w-[280px]"
                title={idea}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Niche & Platform Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="niche-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Industry / Creator Niche
            </label>
            <select
              id="niche-select"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Target Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border transition ${
                    platform === p.id
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{p.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.ratio}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hook Angles Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
            <span>Hook Strategy & Psychological Trigger</span>
            <span className="text-[11px] text-slate-600 font-normal">0-3s retention blueprint</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {HOOK_ANGLES.map((angle) => {
              const isSelected = hookAngle === angle.id;
              return (
                <button
                  key={angle.id}
                  type="button"
                  onClick={() => setHookAngle(angle.id)}
                  className={`p-3 rounded-xl text-left border transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white ring-1 ring-indigo-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base">{angle.icon}</span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {angle.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                      {angle.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Styling & Vibe */}
        {showAdvanced && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Video Vibe & Lighting Atmosphere
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVibe(v.id)}
                  className={`p-2.5 rounded-lg text-left border text-xs font-semibold transition flex items-center gap-2 ${
                    vibe === v.id
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${v.color}`} />
                  <span className="truncate">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Engine Status Block */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">AI Model Status</span>
                <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                  Gemini 2.5 Flash Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generating viral-optimized prompts including camera movements, text overlays, and sound cues.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isLocked ? (
            <button
              id="generate-locked-btn"
              type="button"
              onClick={onOpenPaywall}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Unlock Pro ($25 for 1-Year or $100 Lifetime)</span>
            </button>
          ) : (
            <button
              id="generate-hook-btn"
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-xl shadow-black/60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-black" />
                  <span>Gemini 2.5 Flash is Crafting Viral Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm sm:text-base">Generate AI Hook & Video Blueprint</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
