import React, { useState } from 'react';
import {
  Copy,
  Check,
  Video,
  Camera,
  Sun,
  Volume2,
  Type as TypeIcon,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  Lock,
} from 'lucide-react';
import { ViralHookPrompt, UserAccount } from '../types';

interface HookResultCardProps {
  hook: ViralHookPrompt;
  user?: UserAccount;
  onOpenPaywall?: () => void;
  onSendToFalRender: (promptText: string, suggestedRatio: '9:16' | '16:9' | '1:1') => void;
}

export const HookResultCard: React.FC<HookResultCardProps> = ({
  hook,
  user,
  onOpenPaywall,
  onSendToFalRender,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const isPro = user?.isPro || false;

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2200);
  };

  const handleSpeakHook = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(hook.hookSpokenText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRenderClick = () => {
    onSendToFalRender(hook.falAiVideoPrompt, hook.suggestedAspectRatio);
    if (!isPro && onOpenPaywall) {
      // It scrolls down to studio and opens paywall prompt
    }
  };

  const jsonSnippet = JSON.stringify(
    {
      hookTitle: hook.hookTitle,
      patternInterrupt: hook.patternInterrupt,
      hookSpokenText: hook.hookSpokenText,
      cameraMovement: hook.cameraMovement,
      lightingAndColor: hook.lightingAndColor,
      soundCue: hook.soundCue,
      textOverlayConfig: hook.textOverlayConfig,
      falAiVideoPrompt: hook.falAiVideoPrompt,
    },
    null,
    2
  );

  return (
    <div id={`hook-result-${hook.id}`} className="space-y-6">
      {/* Top Summary Banner */}
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {hook.hookAngle.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                {hook.niche}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                {hook.platform.toUpperCase()} ({hook.suggestedAspectRatio})
              </span>
              {!isPro && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Free Creation Tier
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {hook.hookTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Topic: <span className="text-slate-200">"{hook.topic}"</span>
            </p>
          </div>

          {/* Quick 1-Click Action to Fal AI Video Render & JSON toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showJson ? 'Hide JSON' : 'View JSON'}</span>
            </button>

            <button
              id="send-to-fal-btn"
              onClick={handleRenderClick}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 ${
                isPro
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 shadow-indigo-500/20'
              }`}
            >
              {isPro ? (
                <>
                  <Video className="w-4 h-4 text-white" />
                  <span>Render Video in Fal AI</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-white" />
                  <span>Video Studio (Pro GPU)</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional JSON Viewer */}
        {showJson && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
                Full Blueprint JSON Schema
              </span>
              <button
                onClick={() => copyToClipboard(jsonSnippet, 'json-full')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
              >
                {copiedSection === 'json-full' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'json-full' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
              {jsonSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Grid of Core Viral Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. 0-3s Pattern Interrupt */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                  ⚡ 0:00 - 0:03
                </span>
                <h3 className="font-extrabold text-white text-sm">
                  0-3s Pattern Interrupt
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(hook.patternInterrupt, 'interrupt')}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition"
                title="Copy pattern interrupt"
              >
                {copiedSection === 'interrupt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 border border-slate-800/80 rounded-xl p-4">
              {hook.patternInterrupt}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Goal: Force thumb-stop in first 200ms</span>
            <span className="font-mono text-indigo-400 font-semibold">100% Watch Rate</span>
          </div>
        </div>

        {/* 2. Spoken Script Hook with Audio Voice Playback */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                  🎙️ Spoken Script
                </span>
                <h3 className="font-extrabold text-white text-sm">
                  Voice & Narration Hook
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSpeakHook}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isPlayingAudio
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                  title="Listen to AI voice preview"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{isPlayingAudio ? 'Speaking...' : 'Audio'}</span>
                </button>
                <button
                  onClick={() => copyToClipboard(hook.hookSpokenText, 'spoken')}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition"
                  title="Copy spoken script"
                >
                  {copiedSection === 'spoken' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
              <p className="text-sm sm:text-base text-slate-100 font-semibold italic leading-relaxed">
                "{hook.hookSpokenText}"
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>High-retention curiosity gap opening</span>
            <span className="font-mono text-indigo-400 font-semibold">~3.2s Duration</span>
          </div>
        </div>
      </div>

      {/* Camera, Lighting, Sound & Text Overlay Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Camera Movement */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <Camera className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Camera Movement
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {hook.cameraMovement}
          </p>
        </div>

        {/* Lighting & Vibe */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <Sun className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lighting & Vibe
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {hook.lightingAndColor}
          </p>
        </div>

        {/* Sound Cues */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <Volume2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sound Cues & SFX
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {hook.soundCue}
          </p>
        </div>

        {/* Text Overlay */}
        <div className="bg-[#0c0c0e] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <TypeIcon className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              On-Screen Text
            </h4>
          </div>
          <p className="text-xs font-bold text-white mb-1">
            "{hook.textOverlayConfig.words}"
          </p>
          <p className="text-[11px] text-slate-500">
            {hook.textOverlayConfig.position} • {hook.textOverlayConfig.color}
          </p>
        </div>
      </div>

      {/* Scene-by-Scene Timeline */}
      <div className="bg-[#0c0c0e] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Full Video Scene-By-Scene Timeline
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Estimated Duration: <strong className="text-slate-300">{hook.durationSeconds || 15}s</strong>
          </span>
        </div>

        <div className="space-y-3">
          {hook.scenes?.map((scene, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center transition"
            >
              <div className="md:col-span-2 flex md:flex-col items-center md:items-start justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                  {scene.second}
                </span>
                <span className="text-[10px] text-slate-600 mt-1 uppercase font-semibold">
                  Scene {idx + 1}
                </span>
              </div>

              <div className="md:col-span-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Visual Action & Camera
                </p>
                <p className="text-xs text-slate-200">
                  {scene.visualAction}
                </p>
                <p className="text-[11px] text-indigo-400 mt-1">
                  🎥 {scene.cameraMovement}
                </p>
              </div>

              <div className="md:col-span-5 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Spoken Script & Narration
                </p>
                <p className="text-xs text-slate-200 font-medium">
                  "{scene.narrationAudio}"
                </p>
                {scene.onScreenText && (
                  <p className="text-[11px] text-indigo-300 mt-1 font-semibold">
                    Overlay: [{scene.onScreenText}]
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fal AI Dedicated Prompt Box */}
      <div id="fal-prompt-card" className="bg-[#0c0c0e] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Fal AI Direct Video Generation Prompt
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  LTX-Video / Kling
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Hyper-detailed cinematic prompt formatted for text-to-video diffusion models.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(hook.falAiVideoPrompt, 'fal-prompt')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition"
            >
              {copiedSection === 'fal-prompt' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSendToFalRender(hook.falAiVideoPrompt, hook.suggestedAspectRatio)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render in Fal Studio</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed select-all">
          {hook.falAiVideoPrompt}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>
            Negative Prompt: <span className="text-slate-600">{hook.negativePrompt}</span>
          </span>
          <span className="text-indigo-400 font-mono">
            Aspect Ratio: {hook.suggestedAspectRatio} • 97 Frames
          </span>
        </div>
      </div>
    </div>
  );
};
