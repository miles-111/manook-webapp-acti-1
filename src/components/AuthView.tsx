import React, { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  MousePointerClick,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CrosshairColorPreset, CrosshairSettings } from '../types';
import {
  DEFAULT_CROSSHAIR,
  drawCrosshairOnCanvas,
  generateValorantCode,
} from '../utils/aimMath';

const SHOWCASE_COLORS: { preset: CrosshairColorPreset; hex: string; label: string }[] = [
  { preset: 'Cyan', hex: '#00E5FF', label: 'Cyan' },
  { preset: 'Red', hex: '#FF4655', label: 'Crimson' },
  { preset: 'Green', hex: '#00FF66', label: 'Green' },
  { preset: 'Yellow', hex: '#FFE600', label: 'Yellow' },
  { preset: 'Pink', hex: '#FF55FF', label: 'Pink' },
  { preset: 'White', hex: '#FFFFFF', label: 'White' },
];

export const AuthView: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInDemo,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Interactive showcase crosshair state
  const [colorIdx, setColorIdx] = useState(0);
  const showcaseCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeShowcaseColor = SHOWCASE_COLORS[colorIdx];
  const showcaseCrosshair: CrosshairSettings = {
    ...DEFAULT_CROSSHAIR,
    colorPreset: activeShowcaseColor.preset,
    outlines: true,
    outlineThickness: 1,
    outlineOpacity: 0.75,
  };
  const showcaseCode = generateValorantCode(showcaseCrosshair);

  useEffect(() => {
    const canvas = showcaseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Sleek tactical dark arena preview
    const bg = ctx.createRadialGradient(w / 2, h / 2, 16, w / 2, h / 2, w * 0.68);
    bg.addColorStop(0, '#1B2333');
    bg.addColorStop(1, '#0B0E14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle tactical grid
    ctx.strokeStyle = 'rgba(34, 42, 58, 0.7)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center reference ring
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
    ctx.stroke();

    drawCrosshairOnCanvas(ctx, w / 2, h / 2, showcaseCrosshair, 2.2);
  }, [colorIdx]);

  const handleCycleColor = () => {
    setColorIdx((prev) => (prev + 1) % SHOWCASE_COLORS.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Enter your email and password to continue.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, playerTag.trim() || 'Player', 'freelancer');
      }
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInDemo();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full tactical-grid-bg text-slate-100 flex flex-col lg:flex-row">
      {/* Left Side: Brand + Working Sign In / Create Account Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-7">
          {/* Logo & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FF4655] text-white shadow-lg shadow-[#FF4655]/20">
                <Crosshair className="h-6 w-6" />
              </div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white">
                AssetSilo
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance leading-snug">
              Your Crosshairs, Sens &amp; Loadouts — Synced Anywhere
            </h1>
          </div>

          {/* Auth Card */}
          <div className="rounded-xl border border-[#222A3A] bg-[#131822] p-6 sm:p-7">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setLocalError(null);
                }}
                className={`rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#FF4655] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setLocalError(null);
                }}
                className={`rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#FF4655] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {activeError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#FF4655]/40 bg-[#FF4655]/10 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#FF4655] mt-0.5" />
                <span>{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Player Tag
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={playerTag}
                      onChange={(e) => setPlayerTag(e.target.value)}
                      placeholder="e.g. AceVandal"
                      maxLength={80}
                      className="w-full rounded-lg border border-[#222A3A] bg-[#0B0E14] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={256}
                    className="w-full rounded-lg border border-[#222A3A] bg-[#0B0E14] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#222A3A] bg-[#0B0E14] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF4655] py-3 text-sm font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Jump In' : 'Create Account'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#222A3A]" />
              <span className="text-[11px] font-medium text-slate-500">or</span>
              <div className="h-px flex-1 bg-[#222A3A]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#222A3A] bg-[#0B0E14] py-2.5 px-3 text-xs font-semibold text-slate-200 hover:border-slate-500 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleDemo}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 py-2.5 px-3 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Quick Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Live Interactive Valorant Loadout & Crosshair Showcase */}
      <div className="flex-1 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-[#222A3A] bg-[#0E121B]/80 px-6 py-10 sm:px-12">
        <div className="w-full max-w-lg rounded-xl border border-[#222A3A] bg-[#131822] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#222A3A] pb-4">
            <div>
              <p className="text-xs font-semibold text-[#00E5FF]">Sample Pro Loadout</p>
              <h2 className="font-display text-xl font-bold text-white mt-0.5">
                Valorant Main · Crisp Dotless
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-400">1920x1080</span>
          </div>

          {/* Clickable Live Crosshair Preview Canvas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <MousePointerClick className="h-3.5 w-3.5 text-[#00E5FF]" />
                Click preview to toggle color
              </span>
              <span
                className="font-mono font-semibold"
                style={{ color: activeShowcaseColor.hex }}
              >
                {activeShowcaseColor.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCycleColor}
              className="group relative block w-full overflow-hidden rounded-lg border border-[#222A3A] hover:border-[#00E5FF]/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
              title="Click to cycle crosshair color"
            >
              <canvas
                ref={showcaseCanvasRef}
                width={480}
                height={240}
                className="block w-full h-auto"
              />
            </button>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SHOWCASE_COLORS.map((c, idx) => (
                <button
                  key={c.preset}
                  type="button"
                  onClick={() => setColorIdx(idx)}
                  className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    colorIdx === idx
                      ? 'border-white/50 bg-[#1B2230] text-white'
                      : 'border-[#222A3A] bg-[#0B0E14] text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Loadout Numbers */}
          <div className="grid grid-cols-4 gap-3 border-t border-[#222A3A] pt-4">
            <div>
              <div className="text-[11px] text-slate-400">Mouse DPI</div>
              <div className="font-mono text-base font-bold text-white mt-0.5">800</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">In-Game Sens</div>
              <div className="font-mono text-base font-bold text-white mt-0.5">0.35</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">eDPI</div>
              <div className="font-mono text-base font-bold text-[#00E5FF] mt-0.5">280</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">360° Swipe</div>
              <div className="font-mono text-base font-bold text-[#FF4655] mt-0.5">46.7 cm</div>
            </div>
          </div>

          {/* Live Code Readout */}
          <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 shrink-0">Valorant Code</span>
            <code className="font-mono text-xs text-slate-200 truncate">{showcaseCode}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
