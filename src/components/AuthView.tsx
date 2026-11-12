import React, { useState } from 'react';
import {
  FolderArchive,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'freelancer' | 'client'>('freelancer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName, role);
      }
    } catch {
      // Handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'freelancer' | 'client') => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInDemo(demoRole);
    } catch {
      // Handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#fbf9f5] text-[#2b2118]">
      {/* Left Brand Panel - Espresso Brown */}
      <div className="relative flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#2d1e15] bg-[#1a120c] p-8 md:p-12 text-[#f4eee6] md:w-5/12 lg:w-4/12">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#c68953] to-[#8d4e28] text-white shadow-lg">
              <FolderArchive className="h-6 w-6" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#fcf9f5]">
                AssetSilo
              </span>
              <p className="text-xs text-[#a9988b]">Client File Portal</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#fcf9f5] leading-tight">
              Secure client file management, made effortless.
            </h2>
            <p className="text-sm text-[#bfb0a3] leading-relaxed">
              Give your clients a polished, private portal to upload, review, and organize deliverables without email clutter or broken links.
            </p>
          </div>

          {/* Value Props */}
          <div className="mt-10 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2d1e15] text-[#d1945f]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs text-[#bfb0a3] leading-relaxed">
                <strong className="text-[#f4eee6]">Client-isolated silos:</strong> Each client only accesses their assigned project assets.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2d1e15] text-[#d1945f]">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-xs text-[#bfb0a3] leading-relaxed">
                <strong className="text-[#f4eee6]">Instant asset inspection:</strong> High-res preview, file size tracking, and rapid downloads.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2d1e15] text-[#d1945f]">
                <Briefcase className="h-4 w-4" />
              </div>
              <p className="text-xs text-[#bfb0a3] leading-relaxed">
                <strong className="text-[#f4eee6]">Designer-first workflow:</strong> Clean espresso & cream aesthetic tailored for creative professionals.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Fast Track */}
        <div className="mt-10 rounded-2xl border border-[#2d1e15] bg-[#22160f] p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-[#e8c8ad]">Quick Evaluation</span>
            <span className="rounded-full bg-[#3d291d] px-2 py-0.5 text-[10px] font-mono text-[#d1945f]">
              1-Click Demo
            </span>
          </div>
          <p className="text-[11px] text-[#a9988b] mb-3">
            Want to test immediately without typing credentials?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('freelancer')}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#3d291d] bg-[#2d1e15] py-2 text-xs font-semibold text-[#f4eee6] hover:bg-[#34241b] transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Designer View</span>
            </button>
            <button
              onClick={() => handleDemoLogin('client')}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#3d291d] bg-[#2d1e15] py-2 text-xs font-semibold text-[#f4eee6] hover:bg-[#34241b] transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Client View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Content Panel - Soft Cream & Warm Taupe */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Tab Selector */}
          <div className="flex rounded-xl border border-[#e6ded4] bg-[#f4efe8] p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                clearError();
                setLocalError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#2b2118] shadow-xs'
                  : 'text-[#7a6e65] hover:text-[#2b2118]'
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
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#2b2118] shadow-xs'
                  : 'text-[#7a6e65] hover:text-[#2b2118]'
              }`}
            >
              Create an Account
            </button>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-[#e6ded4] bg-white p-7 shadow-xs">
            <div className="mb-6">
              <h3 className="font-serif text-xl font-bold text-[#2b2118]">
                {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h3>
              <p className="mt-1 text-xs text-[#7a6e65]">
                {mode === 'signin'
                  ? 'Sign in to access your secure client portal'
                  : 'Get started with your free AssetSilo workspace'}
              </p>
            </div>

            {activeError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#423730] mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9084]">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Elena Vance"
                        maxLength={100}
                        className="w-full rounded-xl border border-[#dfd6cb] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#423730] mb-1.5">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('freelancer')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                          role === 'freelancer'
                            ? 'border-[#a35c34] bg-[#fbf5ee] text-[#8d4e28]'
                            : 'border-[#dfd6cb] text-[#7a6e65] hover:bg-[#faf7f2]'
                        }`}
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Freelancer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('client')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                          role === 'client'
                            ? 'border-[#a35c34] bg-[#fbf5ee] text-[#8d4e28]'
                            : 'border-[#dfd6cb] text-[#7a6e65] hover:bg-[#faf7f2]'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Client</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#423730] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9084]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    maxLength={256}
                    className="w-full rounded-xl border border-[#dfd6cb] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#423730] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9084]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#dfd6cb] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#231710] py-3 text-sm font-semibold text-white shadow-md hover:bg-[#34241b] transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#d1945f]" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create an Account'}</span>
                    <ArrowRight className="h-4 w-4 text-[#d1945f]" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ece4d9]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#9e9084]">
                or continue with
              </span>
              <div className="h-px flex-1 bg-[#ece4d9]" />
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#dfd6cb] bg-white py-2.5 text-xs font-semibold text-[#423730] hover:bg-[#faf7f2] transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              <span>Google Account</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[#8c7e74]">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-semibold text-[#8d4e28] hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="font-semibold text-[#8d4e28] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
