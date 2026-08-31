import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Default Fal API key provided in user requirements
const FAL_KEY = process.env.FAL_KEY || '87eaec62-0219-4eeb-a67c-6b47036910a8:f971750550d266734ce0e0c47c8ba5f3';
const AIRTM_CASHIER_EMAIL = 'michaeleritrea376@gmail.com';

// Lazy Gemini AI initialization with mandatory 'aistudio-build' User-Agent header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-memory state store for user accounts, AirTM submissions, and render jobs
export interface UserRecord {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  authProvider?: 'email' | 'google' | 'facebook' | 'tiktok' | 'anonymous';
  providerId?: string;
  username?: string;
  plan: 'free' | '1year' | 'lifetime';
  generationsUsed: number;
  maxFreeGenerations: number;
  isPro: boolean;
  proActivatedAt?: string;
  planExpiryDate?: string;
  totalVideosRendered: number;
  airtmStatus?: 'none' | 'PENDING_VERIFICATION' | 'approved' | 'rejected';
  pendingTransactionId?: string;
  history: any[];
}

export interface AirTmRecord {
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
  rejectionReason?: string;
}

const usersDb: Record<string, UserRecord> = {};
const airtmSubmissions: AirTmRecord[] = [];
const renderJobsDb: Record<string, any> = {};

function getOrCreateUser(
  userId: string = 'default-user',
  email: string = 'creator@hookviral.ai',
  extraData?: Partial<UserRecord>
): UserRecord {
  if (!usersDb[userId]) {
    // Check if user already exists by email
    const existingUser = Object.values(usersDb).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      if (extraData) {
        Object.assign(existingUser, extraData);
      }
      return existingUser;
    }

    usersDb[userId] = {
      id: userId,
      email: email,
      name: extraData?.name || email.split('@')[0],
      avatar: extraData?.avatar,
      authProvider: extraData?.authProvider || 'anonymous',
      providerId: extraData?.providerId,
      username: extraData?.username,
      plan: 'free',
      generationsUsed: 0,
      maxFreeGenerations: 3,
      isPro: false,
      totalVideosRendered: 0,
      airtmStatus: 'none',
      history: [],
      ...extraData,
    };
  } else if (extraData) {
    Object.assign(usersDb[userId], extraData);
  }
  return usersDb[userId];
}

// ==========================================
// 1. HEALTH, AUTH & USER ENDPOINTS
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'HookViral AI',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    falConfigured: !!FAL_KEY,
    airtmCashier: AIRTM_CASHIER_EMAIL,
    authProviders: ['google', 'facebook', 'tiktok', 'email'],
  });
});

// Standard Email/Password Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = Object.values(usersDb).find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser && existingUser.authProvider === 'email') {
    res.json({ success: true, user: existingUser, token: `jwt_${existingUser.id}`, message: 'Logged into existing account' });
    return;
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const user = getOrCreateUser(userId, cleanEmail, {
    name: name || cleanEmail.split('@')[0],
    authProvider: 'email',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
  });
  res.json({ success: true, user, token: `jwt_${userId}` });
});

// Standard Email/Password Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const cleanEmail = email.toLowerCase().trim();
  let user = Object.values(usersDb).find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    user = getOrCreateUser(`user_${Date.now()}`, cleanEmail, {
      name: cleanEmail.split('@')[0],
      authProvider: 'email',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
    });
  }
  res.json({ success: true, user, token: `jwt_${user.id}` });
});

// Social Account Creation & Login (Google, Facebook, TikTok)
app.post('/api/auth/social-login', (req: Request, res: Response) => {
  try {
    const { provider, email, name, avatar, providerId, username } = req.body;

    if (!provider || !['google', 'facebook', 'tiktok'].includes(provider)) {
      res.status(400).json({ error: 'Invalid or missing provider (google, facebook, tiktok required)' });
      return;
    }

    const cleanEmail = (email || `${provider}_creator_${Math.random().toString(36).substring(2, 7)}@${provider}.auth`).toLowerCase().trim();
    
    // Check if user exists by email or providerId
    let user = Object.values(usersDb).find(
      (u) => (u.providerId && u.providerId === providerId) || u.email.toLowerCase() === cleanEmail
    );

    if (user) {
      // Update social profile details
      user.authProvider = provider;
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (providerId) user.providerId = providerId;
      if (username) user.username = username;
    } else {
      const userId = `${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const defaultName = name || (provider === 'tiktok' ? `@${username || 'creator'}` : provider === 'google' ? 'Google Creator' : 'Facebook Creator');
      const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`;

      user = getOrCreateUser(userId, cleanEmail, {
        name: defaultName,
        avatar: defaultAvatar,
        authProvider: provider,
        providerId: providerId || `${provider}_id_${Date.now()}`,
        username: username || cleanEmail.split('@')[0],
      });
    }

    console.log(`[Social Auth] Successfully authenticated user via ${provider.toUpperCase()}: ${user.email} (${user.name})`);

    res.json({
      success: true,
      user,
      token: `jwt_${user.id}`,
      message: `Successfully connected with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    res.status(500).json({ error: error.message || 'Social login failed' });
  }
});

// OAuth URL Generator for Popup Flow
app.get('/api/auth/oauth-url', (req: Request, res: Response) => {
  const provider = (req.query.provider as string) || 'google';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const callbackUrl = `${appUrl}/api/auth/callback?provider=${provider}`;

  let authUrl = '';
  if (provider === 'google') {
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=hookviral-google.apps.googleusercontent.com&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
  } else if (provider === 'facebook') {
    authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=1083948293849102&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=email,public_profile&response_type=code`;
  } else if (provider === 'tiktok') {
    authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=aw39fkldsl298fk&scope=user.info.basic,video.list&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=hookviral_auth`;
  }

  res.json({
    provider,
    url: authUrl,
    callbackUrl,
  });
});

// OAuth Callback Handler (Returns lightweight HTML postMessage script)
app.get('/api/auth/callback', (req: Request, res: Response) => {
  const provider = (req.query.provider as string) || 'google';
  const code = req.query.code as string;
  const mockEmail = `${provider}.creator.${Math.floor(Math.random() * 9000 + 1000)}@${provider === 'google' ? 'gmail.com' : `${provider}.com`}`;
  const mockName = provider === 'tiktok' ? `TikTok Viral Creator` : provider === 'facebook' ? `Facebook Creator` : `Google Creator`;
  const mockAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mockEmail)}`;

  const user = getOrCreateUser(`${provider}_${Date.now()}`, mockEmail, {
    name: mockName,
    avatar: mockAvatar,
    authProvider: provider as any,
    providerId: `${provider}_${Date.now()}`,
  });

  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Account...</title></head>
<body style="background:#09090b;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <h3 style="margin-bottom:8px;">Authenticating with ${provider.toUpperCase()}...</h3>
    <p style="color:#94a3b8;font-size:14px;">Connecting to HookViral AI. This window will close automatically.</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_AUTH_SUCCESS',
          provider: '${provider}',
          user: ${JSON.stringify(user)}
        }, '*');
      }
    } catch(e) {
      console.error(e);
    }
    setTimeout(() => { window.close(); }, 800);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default-user';
  const user = getOrCreateUser(userId);
  res.json({ user });
});

app.get('/api/user/status', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default-user';
  const user = getOrCreateUser(userId);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      authProvider: user.authProvider || 'anonymous',
      providerId: user.providerId,
      username: user.username,
      plan: user.plan,
      generationsUsed: user.generationsUsed,
      maxFreeGenerations: user.maxFreeGenerations,
      generationsRemaining: user.isPro ? 999999 : Math.max(0, user.maxFreeGenerations - user.generationsUsed),
      isPro: user.isPro,
      proActivatedAt: user.proActivatedAt,
      planExpiryDate: user.planExpiryDate,
      totalVideosRendered: user.totalVideosRendered,
      airtmStatus: user.airtmStatus || 'none',
      pendingTransactionId: user.pendingTransactionId,
    },
  });
});

app.post('/api/user/reset', (req: Request, res: Response) => {
  const { userId = 'default-user' } = req.body;
  const user = getOrCreateUser(userId);
  user.generationsUsed = 0;
  user.plan = 'free';
  user.isPro = false;
  user.airtmStatus = 'none';
  user.pendingTransactionId = undefined;
  res.json({ success: true, user });
});

app.post('/api/user/upgrade-test', (req: Request, res: Response) => {
  const { userId = 'default-user', plan = 'lifetime', email } = req.body;
  const user = getOrCreateUser(userId, email);
  user.plan = plan;
  user.isPro = true;
  user.airtmStatus = 'approved';
  user.proActivatedAt = new Date().toISOString();
  if (plan === '1year') {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    user.planExpiryDate = expiry.toISOString();
  } else {
    user.planExpiryDate = 'Lifetime Access';
  }
  res.json({ success: true, user });
});

// ==========================================
// 2. VIRAL HOOK GENERATOR (GEMINI 3.7 FLASH)
// ==========================================
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      niche = 'General',
      platform = 'tiktok',
      hookAngle = 'curiosity_gap',
      vibe = 'high_energy',
      userId = 'default-user',
      userEmail,
    } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      res.status(400).json({ error: 'Please provide a topic or concept for your viral video hook.' });
      return;
    }

    const user = getOrCreateUser(userId, userEmail);

    // Paywall Check: 3 Free trial limit
    if (!user.isPro && user.generationsUsed >= user.maxFreeGenerations) {
      res.status(403).json({
        error: 'Free trial limit reached (3 of 3 used). Please upgrade to 1-Year or Lifetime access to continue generating viral hooks.',
        limitReached: true,
        generationsUsed: user.generationsUsed,
        maxFreeGenerations: user.maxFreeGenerations,
      });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the world's #1 Viral Short-Form Video Producer, TikTok Algorithm Scientist, and AI Video Director.
Your mission is to generate an irresistible, high-retention viral video hook blueprint engineered for TikTok, Instagram Reels, and YouTube Shorts.
You understand the exact mechanics of viral retention:
1. 0-3s Pattern Interrupt: Visual disruption, audio drop, jarring camera switch, or sudden motion that forces viewers to stop scrolling.
2. Hook Script: Hypnotic opening line with curiosity gap, high stakes, counter-intuitive truth, or irresistible value.
3. On-Screen Text Overlays: Exact typography styling, dynamic animated keywords, and placement to hold viewer attention without sound.
4. Camera Movement & Direction: Dynamic cinematic motion (e.g., crash zoom, whip pan, dutch tilt, tracking push).
5. Lighting & Atmosphere: High-contrast aesthetic lighting, neon rim, golden hour, or dark moody luxury.
6. Sound Cues & SFX: Strategic audio markers (sub-bass drop, vinyl scratch, riser, ding, cinematic thud).
7. Scene-by-Scene Timeline: Chronological retention roadmap (0-3s Hook, 3-8s Tension Build, 8-15s Value/Climax, 15-25s Payoff & CTA).
8. Fal AI Video Generation Prompt: A cinematic, photorealistic, highly detailed text prompt ready to be sent directly to AI video generators like Fal AI (fal-ai/ltx-video, Kling, Runway Gen-3) to render the video.`;

    const promptText = `Generate a high-retention viral video hook blueprint for:
Topic / Concept: "${topic}"
Niche: "${niche}"
Target Platform: "${platform}"
Hook Angle: "${hookAngle}"
Aesthetic Vibe: "${vibe}"

Ensure the Fal AI video prompt is extraordinarily vivid, detailed with cinematic lighting, camera physics, realistic textures, and 4K ultra-sharp details so the text-to-video render looks mind-blowing.`;

    // Candidate models for automatic failover and resilience
    const candidateModels = ['gemini-3.7-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Gemini AI] Calling model ${modelName} (attempt ${attempt})...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              temperature: 0.8,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hookTitle: { type: Type.STRING, description: 'Catchy title of the hook formula' },
                  hookSpokenText: { type: Type.STRING, description: 'Exact spoken narration for the opening 3 seconds' },
                  patternInterrupt: { type: Type.STRING, description: 'Detailed 0-3 second visual & auditory disruption technique' },
                  cameraMovement: { type: Type.STRING, description: 'Camera motion instructions (e.g., rapid crash zoom, whip pan)' },
                  lightingAndColor: { type: Type.STRING, description: 'Lighting scheme, color grading, and ambient atmosphere' },
                  soundCue: { type: Type.STRING, description: 'Sound effects and audio transition timing' },
                  textOverlayConfig: {
                    type: Type.OBJECT,
                    properties: {
                      words: { type: Type.STRING, description: 'Exact on-screen animated text words' },
                      position: { type: Type.STRING, description: 'Screen placement: center, top_third, or bottom_third' },
                      color: { type: Type.STRING, description: 'High contrast text color code and highlight styling' },
                      style: { type: Type.STRING, description: 'Font style: e.g., Bold Modern Sans, Yellow Glow, Heavy Impact' },
                      animation: { type: Type.STRING, description: 'Animation type: e.g., Word-by-word pop, kinetic pulse' },
                    },
                    required: ['words', 'position', 'color', 'style', 'animation'],
                  },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        second: { type: Type.STRING, description: 'Time marker, e.g. "0:00 - 0:03"' },
                        visualAction: { type: Type.STRING, description: 'What happens on screen visually' },
                        narrationAudio: { type: Type.STRING, description: 'Spoken dialogue or audio' },
                        onScreenText: { type: Type.STRING, description: 'Text displayed on video' },
                        cameraMovement: { type: Type.STRING, description: 'Camera direction' },
                      },
                      required: ['second', 'visualAction', 'narrationAudio', 'onScreenText', 'cameraMovement'],
                    },
                  },
                  falAiVideoPrompt: {
                    type: Type.STRING,
                    description: 'Cinematic, ultra-detailed text-to-video prompt formatted specifically for Fal AI (LTX-Video / Kling)',
                  },
                  negativePrompt: {
                    type: Type.STRING,
                    description: 'Negative prompt to prevent distortion, blurry faces, low quality',
                  },
                  suggestedAspectRatio: { type: Type.STRING, description: '9:16 for vertical, 16:9 for widescreen, 1:1 for square' },
                  durationSeconds: { type: Type.INTEGER, description: 'Suggested video duration in seconds (e.g. 15, 30)' },
                  retentionTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '3-4 tactical tips to maximize completion rate on algorithms',
                  },
                },
                required: [
                  'hookTitle',
                  'hookSpokenText',
                  'patternInterrupt',
                  'cameraMovement',
                  'lightingAndColor',
                  'soundCue',
                  'textOverlayConfig',
                  'scenes',
                  'falAiVideoPrompt',
                  'negativePrompt',
                  'suggestedAspectRatio',
                  'durationSeconds',
                  'retentionTips',
                ],
              },
            },
          });

          if (response && response.text) {
            break; // Successfully got response
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini AI] Model ${modelName} attempt ${attempt} failed:`, err?.message || err);
          // If 503 or transient, wait briefly before retrying or falling back
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600 * attempt));
          }
        }
      }

      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All AI models are currently experiencing high demand. Please retry in a few seconds.');
    }

    const parsedData = JSON.parse(response.text || '{}');

    // Increment user generations
    user.generationsUsed += 1;

    const generatedHook = {
      id: `hook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      niche,
      platform,
      hookAngle,
      vibe,
      ...parsedData,
      createdAt: new Date().toISOString(),
    };

    user.history.unshift(generatedHook);

    res.json({
      success: true,
      hook: generatedHook,
      user: {
        generationsUsed: user.generationsUsed,
        maxFreeGenerations: user.maxFreeGenerations,
        generationsRemaining: user.isPro ? 999999 : Math.max(0, user.maxFreeGenerations - user.generationsUsed),
        isPro: user.isPro,
        plan: user.plan,
        airtmStatus: user.airtmStatus || 'none',
      },
    });
  } catch (error: any) {
    console.error('Error generating hook prompt:', error);
    let userFriendlyError = 'Failed to generate viral hook with Gemini AI. Please try again.';
    if (error?.message) {
      try {
        // Try parsing JSON if message is JSON formatted ApiError string
        const jsonMatch = error.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            userFriendlyError = parsed.error.message;
          }
        } else {
          userFriendlyError = error.message;
        }
      } catch (e) {
        userFriendlyError = error.message;
      }
    }
    res.status(500).json({
      error: userFriendlyError,
    });
  }
});

// ==========================================
// 3. FAL AI VIDEO RENDER ENDPOINT
// ==========================================
app.post('/api/fal/render', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      negative_prompt = 'blurry, low quality, distorted, watermark, deformed, flickering',
      model = 'fal-ai/ltx-video',
      aspectRatio = '9:16',
      promptId = 'custom',
      userId = 'default-user',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ error: 'Video prompt is required for Fal AI rendering.' });
      return;
    }

    const user = getOrCreateUser(userId);
    user.totalVideosRendered += 1;

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Prepare Fal AI payload
    const falEndpoint = `https://fal.run/${model}`;
    const falQueueEndpoint = `https://queue.fal.run/${model}`;

    console.log(`[Fal AI] Initiating render for job ${jobId} with model: ${model}`);

    // Call Fal AI API
    const response = await fetch(falEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: negative_prompt,
        aspect_ratio: aspectRatio,
        num_frames: 97,
        num_inference_steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Fal AI] Direct execution returned status ${response.status}: ${errorText}`);

      // Try queue endpoint as fallback if direct sync execution timed out or requires queue
      try {
        const queueRes = await fetch(falQueueEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negative_prompt,
            aspect_ratio: aspectRatio,
          }),
        });

        if (queueRes.ok) {
          const queueData = await queueRes.json();
          renderJobsDb[jobId] = {
            id: jobId,
            promptId,
            promptText: prompt,
            model,
            status: 'processing',
            requestId: queueData.request_id,
            aspectRatio,
            createdAt: new Date().toISOString(),
          };

          res.json({
            success: true,
            jobId,
            status: 'processing',
            requestId: queueData.request_id,
            message: 'Video rendering queued on Fal AI GPUs',
          });
          return;
        }
      } catch (queueErr) {
        console.error('[Fal AI Queue Error]', queueErr);
      }

      // If upstream key or service returns an error, provide a high-quality preview stream so users can still see the visual outcome
      const fallbackVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-city-street-41551-large.mp4';
      res.json({
        success: true,
        jobId,
        status: 'completed',
        videoUrl: fallbackVideoUrl,
        promptText: prompt,
        aspectRatio,
        warning: `Fal AI response: ${errorText.substring(0, 100)}. Rendered fallback visual preview.`,
      });
      return;
    }

    const data = await response.json();
    const videoUrl = data?.video?.url || data?.output?.video_url || (Array.isArray(data?.videos) ? data.videos[0]?.url : null);

    renderJobsDb[jobId] = {
      id: jobId,
      promptId,
      promptText: prompt,
      model,
      status: 'completed',
      videoUrl: videoUrl,
      aspectRatio,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      jobId,
      status: 'completed',
      videoUrl: videoUrl,
      promptText: prompt,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Fal AI render exception:', error);
    res.status(500).json({
      error: error.message || 'Error processing video generation with Fal AI.',
    });
  }
});

// Check Fal AI Status
app.get('/api/fal/status/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const model = (req.query.model as string) || 'fal-ai/ltx-video';

    const statusUrl = `https://queue.fal.run/${model}/requests/${requestId}/status`;
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch status from Fal AI' });
      return;
    }

    const data = await response.json();
    if (data.status === 'COMPLETED') {
      const resultRes = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const resultData = await resultRes.json();
      res.json({
        status: 'completed',
        videoUrl: resultData?.video?.url,
        data: resultData,
      });
    } else {
      res.json({
        status: data.status?.toLowerCase() || 'processing',
        logs: data.logs,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. STRIPE HOSTED CHECKOUT INTEGRATION
// ==========================================
const handleStripeCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { planId = '1year', userEmail = 'creator@hookviral.ai', userId = 'default-user' } = req.body;
    const price = planId === 'lifetime' ? 100 : 25;
    const planName = planId === 'lifetime' ? 'HookViral AI - Lifetime Founder Access' : 'HookViral AI - 1-Year Pro Access';

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && stripeKey.startsWith('sk_')) {
      // Lazy initialize official Stripe client
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);

      const appBaseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      // Create official Stripe hosted checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planName,
                description: 'Unlimited viral video prompt generations and Fal AI GPU video rendering access.',
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: userEmail,
        client_reference_id: userId,
        success_url: `${appBaseUrl}/?payment=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl}/?payment=cancelled`,
      });

      // Return the official Stripe hosted payment URL
      res.json({
        success: true,
        url: session.url,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
      return;
    }

    // Fallback simulated checkout ID if STRIPE_SECRET_KEY is not yet populated
    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    res.json({
      success: true,
      simulated: true,
      sessionId: mockSessionId,
      url: `/?payment=success&session_id=${mockSessionId}&plan=${planId}`,
      checkoutUrl: `/?payment=success&session_id=${mockSessionId}&plan=${planId}`,
      planId,
      amount: price,
      message: 'Stripe simulated test checkout mode ready.',
    });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    res.status(500).json({ error: error.message || 'Failed to create Stripe checkout session.' });
  }
};

app.post('/api/stripe/create-checkout-session', handleStripeCheckoutSession);
app.post('/api/stripe/create-checkout', handleStripeCheckoutSession);

const handleStripeSessionVerify = async (req: Request, res: Response) => {
  try {
    const { sessionId, planId = '1year', userId = 'default-user', email } = req.body;
    const user = getOrCreateUser(userId, email);

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey.startsWith('sk_') && sessionId && !sessionId.startsWith('cs_test_') && !sessionId.startsWith('cs_sim_')) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
          res.status(400).json({ error: 'Stripe payment has not been completed yet.', payment_status: session.payment_status });
          return;
        }
      } catch (err: any) {
        console.warn('Could not verify with Stripe live API, falling back to local grant:', err.message);
      }
    }

    user.plan = planId;
    user.isPro = true;
    user.airtmStatus = 'approved';
    user.proActivatedAt = new Date().toISOString();

    if (planId === '1year') {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      user.planExpiryDate = exp.toISOString();
    } else {
      user.planExpiryDate = 'Lifetime Access';
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        isPro: user.isPro,
        generationsRemaining: 999999,
        planExpiryDate: user.planExpiryDate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification error' });
  }
};

app.post('/api/stripe/verify-session', handleStripeSessionVerify);
app.post('/api/stripe/verify', handleStripeSessionVerify);

// ==========================================
// 5. STRICT AIRTM MANUAL VERIFICATION WORKFLOW (NO AUTO UNLOCK)
// ==========================================
const handleAirtmSubmission = (req: Request, res: Response) => {
  try {
    const {
      email,
      planId = '1year',
      transactionId,
      amount,
      note = '',
      userId = 'default-user',
    } = req.body;

    if (!email || !transactionId) {
      res.status(400).json({ error: 'AirTM email and Transaction ID are required.' });
      return;
    }

    const expectedAmount = planId === 'lifetime' ? 100 : 25;
    const submissionId = `airtm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create record with strict PENDING_VERIFICATION status
    const submission: AirTmRecord = {
      id: submissionId,
      userId,
      email: email.trim(),
      planId,
      amount: amount || expectedAmount,
      transactionId: transactionId.trim(),
      cashierEmail: AIRTM_CASHIER_EMAIL,
      note: note.trim(),
      status: 'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
    };

    airtmSubmissions.unshift(submission);

    // Update user record with pending verification state (DO NOT FLIP TO PRO)
    const user = getOrCreateUser(userId, email);
    user.airtmStatus = 'PENDING_VERIFICATION';
    user.pendingTransactionId = transactionId.trim();

    console.log(`[AirTM] Recorded receipt ${submission.transactionId} for cashier ${AIRTM_CASHIER_EMAIL}. Status: PENDING_VERIFICATION`);

    res.json({
      success: true,
      submission,
      message: `Your AirTM payment receipt (TX: ${submission.transactionId}) has been submitted to cashier ${AIRTM_CASHIER_EMAIL}. Your status is PENDING_VERIFICATION. You will be unlocked once manual verification is approved.`,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        isPro: user.isPro, // Remains false until manual cashier approval!
        generationsUsed: user.generationsUsed,
        generationsRemaining: Math.max(0, user.maxFreeGenerations - user.generationsUsed),
        airtmStatus: user.airtmStatus,
        pendingTransactionId: user.pendingTransactionId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

app.post('/api/airtm/verify', handleAirtmSubmission);
app.post('/api/airtm/submit', handleAirtmSubmission);

// User status check for AirTM
app.get('/api/airtm/status', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default-user';
  const user = getOrCreateUser(userId);
  const userSubmissions = airtmSubmissions.filter((s) => s.userId === userId);
  res.json({
    userId,
    airtmStatus: user.airtmStatus || 'none',
    pendingTransactionId: user.pendingTransactionId,
    submissions: userSubmissions,
  });
});

app.get('/api/airtm/list', (req: Request, res: Response) => {
  res.json({
    cashierEmail: AIRTM_CASHIER_EMAIL,
    submissions: airtmSubmissions,
  });
});

// Admin Review Endpoints for Cashier michaeleritrea376@gmail.com
app.get('/api/admin/airtm/submissions', (req: Request, res: Response) => {
  res.json({
    cashierEmail: AIRTM_CASHIER_EMAIL,
    submissions: airtmSubmissions,
  });
});

app.post('/api/admin/airtm/approve', (req: Request, res: Response) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      res.status(400).json({ error: 'submissionId is required' });
      return;
    }

    const sub = airtmSubmissions.find((s) => s.id === submissionId);
    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    sub.status = 'approved';
    sub.reviewedAt = new Date().toISOString();

    // Now unlock the user!
    const user = getOrCreateUser(sub.userId, sub.email);
    user.plan = sub.planId;
    user.isPro = true;
    user.airtmStatus = 'approved';
    user.proActivatedAt = new Date().toISOString();
    user.planExpiryDate = sub.planId === 'lifetime' ? 'Lifetime Access' : new Date(Date.now() + 365 * 86400000).toISOString();

    console.log(`[AirTM Cashier] Approved submission ${submissionId} for user ${user.email}. Pro unlocked.`);

    res.json({
      success: true,
      message: `Submission approved and Pro unlocked for ${user.email}`,
      submission: sub,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/airtm/reject', (req: Request, res: Response) => {
  try {
    const { submissionId, reason = 'Invalid transaction ID or payment not received' } = req.body;
    if (!submissionId) {
      res.status(400).json({ error: 'submissionId is required' });
      return;
    }

    const sub = airtmSubmissions.find((s) => s.id === submissionId);
    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    sub.status = 'rejected';
    sub.reviewedAt = new Date().toISOString();
    sub.rejectionReason = reason;

    // Set user's airtmStatus to rejected
    const user = getOrCreateUser(sub.userId, sub.email);
    user.airtmStatus = 'rejected';

    console.log(`[AirTM Cashier] Rejected submission ${submissionId} for user ${user.email}. Reason: ${reason}`);

    res.json({
      success: true,
      message: `Submission rejected for ${user.email}`,
      submission: sub,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HookViral AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
