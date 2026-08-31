export type PlanType = 'free' | '1year' | 'lifetime';

export type PlatformType = 'tiktok' | 'reels' | 'shorts' | 'ads';

export type HookAngle =
  | 'curiosity_gap'
  | 'shocking_stat'
  | 'controversial_take'
  | 'visual_transformation'
  | 'relatable_struggle'
  | 'storytelling'
  | 'money_hack'
  | 'secret_reveal';

export type VideoVibe =
  | 'high_energy'
  | 'cinematic_moody'
  | 'minimalist_clean'
  | 'urgent_breaking'
  | 'hypnotic_aesthetic'
  | 'dark_luxury';

export interface SceneStep {
  second: string;
  visualAction: string;
  narrationAudio: string;
  onScreenText: string;
  cameraMovement: string;
}

export interface ViralHookPrompt {
  id: string;
  topic: string;
  niche: string;
  platform: PlatformType;
  hookAngle: HookAngle;
  vibe: VideoVibe;
  hookTitle: string;
  hookSpokenText: string;
  patternInterrupt: string;
  cameraMovement: string;
  lightingAndColor: string;
  soundCue: string;
  textOverlayConfig: {
    words: string;
    position: 'center' | 'top_third' | 'bottom_third';
    color: string;
    style: string;
    animation: string;
  };
  scenes: SceneStep[];
  falAiVideoPrompt: string;
  negativePrompt: string;
  suggestedAspectRatio: '9:16' | '16:9' | '1:1';
  durationSeconds: number;
  retentionTips: string[];
  createdAt: string;
}

export interface VideoRenderJob {
  id: string;
  promptId: string;
  promptText: string;
  model: 'fal-ai/ltx-video' | 'fal-ai/kling-video/v1/standard/text-to-video' | 'fal-ai/fast-svd';
  status: 'idle' | 'submitting' | 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  requestId?: string | null;
  error?: string | null;
  progress?: number;
  statusMessage?: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  createdAt: string;
  completedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  authProvider?: 'email' | 'google' | 'facebook' | 'tiktok' | 'anonymous';
  providerId?: string;
  username?: string;
  plan: PlanType;
  generationsUsed: number;
  maxFreeGenerations: number;
  isPro: boolean;
  proActivatedAt?: string;
  planExpiryDate?: string;
  totalVideosRendered: number;
  airtmStatus?: 'none' | 'PENDING_VERIFICATION' | 'approved' | 'rejected';
  pendingTransactionId?: string;
}

export interface PaymentPlan {
  id: '1year' | 'lifetime';
  name: string;
  price: number;
  period: string;
  description: string;
  badge?: string;
  features: string[];
  popular?: boolean;
}

export interface AirTmSubmission {
  id: string;
  userId: string;
  email: string;
  planId: '1year' | 'lifetime';
  amount: number;
  transactionId: string;
  cashierEmail: string;
  note?: string;
  status: 'PENDING_VERIFICATION' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
}

export interface ViralTemplate {
  id: string;
  title: string;
  niche: string;
  category: string;
  hookText: string;
  interruptTechnique: string;
  viewsEstimate: string;
  videoPromptSample: string;
}

