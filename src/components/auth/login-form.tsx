'use client';

import {
  useState, useRef, useEffect, useCallback,
  type KeyboardEvent, type ClipboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'email' | 'credentials' | 'pin' | 'setup';

interface LoginFormProps {
  callbackUrl: string;
  initialEmail?: string;
}

// ── 5-digit PIN boxes ─────────────────────────────────────────────────────────

function PINInput({ value, onChange, disabled, autoFocus }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const refs   = useRef<(HTMLInputElement | null)[]>(Array(5).fill(null));
  const digits = Array.from({ length: 5 }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const update = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const next = [...digits];
    next[i] = char.slice(-1);
    onChange(next.join(''));
    if (char && i < 4) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      onChange(next.join(''));
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    else if   (e.key === 'ArrowRight' && i < 4) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next.join(''));
    refs.current[Math.min(pasted.length, 4)]?.focus();
  };

  return (
    <div className="flex gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => update(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-[52px] w-10 rounded-lg border-2 text-center text-lg font-semibold outline-none transition-colors',
            'bg-white text-gray-900 dark:bg-zinc-700 dark:text-white',
            'disabled:cursor-not-allowed disabled:opacity-40',
            d
              ? 'border-gray-800 dark:border-white'
              : 'border-gray-300 dark:border-zinc-500 hover:border-gray-500 dark:hover:border-zinc-300 focus:border-gray-800 dark:focus:border-white',
          )}
        />
      ))}
    </div>
  );
}

// ── Password field with show/hide ─────────────────────────────────────────────

function PasswordInput({ name, placeholder, value, onChange, disabled, hasError, autoFocus }: {
  name: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        autoComplete={name === 'password' ? 'current-password' : 'new-password'}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors',
          'bg-white text-gray-900 placeholder:text-gray-400',
          'dark:bg-zinc-700 dark:text-white dark:placeholder:text-zinc-400',
          'focus:border-gray-700 dark:focus:border-zinc-300 disabled:opacity-50',
          hasError ? 'border-red-500' : 'border-gray-300 dark:border-zinc-500',
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function LoginForm({ callbackUrl, initialEmail = '' }: LoginFormProps) {
  const router       = useRouter();
  const verifyingRef = useRef(false);

  const [step,      setStep]      = useState<Step>('email');
  const [email,     setEmail]     = useState(initialEmail);
  const [password,  setPassword]  = useState('');
  const [pin,       setPin]       = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [newPin,    setNewPin]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const goBack = (to: Step) => {
    setStep(to);
    setError('');
    if (to === 'email') { setPassword(''); setPin(''); }
    if (to === 'credentials') { setPin(''); }
  };

  // ── Step 1: check email status ──────────────────────────────────────────────
  const checkEmail = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) { setError('Enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Enter a valid email address.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/check-login-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data.status === 'inactive') {
        setError('Your account is inactive. Contact your administrator.');
        return;
      }
      setStep(data.status === 'needs_setup' ? 'setup' : 'credentials');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Step 2a: verify password ────────────────────────────────────────────────
  const checkCredentials = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!password) { setError('Enter your password.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('pin');
      } else {
        setError(data.message ?? 'Invalid email or password.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  // ── Step 2b: sign in with PIN ───────────────────────────────────────────────
  const verify = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 5) { setError('Enter all 5 digits.'); return; }
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setError('');
    setLoading(true);
    try {
      // Pre-validate PIN via a plain API call first — avoids signIn redirecting on error
      const pinRes  = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), pin }),
      });
      const pinData = await pinRes.json();
      if (!pinData.success) {
        setError(pinData.message ?? 'Incorrect PIN. Please try again.');
        setPin('');
        verifyingRef.current = false;
        return;
      }

      // PIN confirmed — sign in with email + password + pin
      const res = await signIn('credentials', { email, password, pin, redirect: false });
      if (!res?.ok || res?.error) {
        setError('Sign-in failed — please try again.');
        setPin('');
        verifyingRef.current = false;
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Authentication failed — please try again.');
      verifyingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [email, password, pin, callbackUrl, router]);

  // No auto-submit for PIN — user must press Sign In explicitly

  // ── Step 3 (first-login): set up credentials ────────────────────────────────
  const setupAccount = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (newPw.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)    { setError('Passwords do not match.'); return; }
    if (newPin.length < 5)      { setError('Enter all 5 digits for your PIN.'); return; }

    setLoading(true);
    try {
      const setupRes = await fetch('/api/setup-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: newPw, pin: newPin }),
      });
      const setupData = await setupRes.json();
      if (!setupData.success) { setError(setupData.message ?? 'Setup failed.'); return; }

      // Credentials saved — sign straight in
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      const res = await signIn('credentials', { email, password: newPw, pin: newPin, redirect: false });
      if (!res?.ok || res?.error) {
        setError('Account created but sign-in failed — try logging in normally.');
        verifyingRef.current = false;
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, newPw, confirmPw, newPin, callbackUrl, router]);

  // Auto-submit setup PIN on 5th digit (if password fields are already filled)
  useEffect(() => {
    if (newPin.length === 5 && step === 'setup' && newPw.length >= 8 && newPw === confirmPw && !loading) {
      setupAccount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPin]);

  const inputBase = cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
    'bg-white text-gray-900 placeholder:text-gray-400',
    'dark:bg-zinc-700 dark:text-white dark:placeholder:text-zinc-400',
    'focus:border-gray-700 dark:focus:border-zinc-300 disabled:opacity-50',
  );

  return (
    <div className="w-full max-w-[340px]">

      {/* ── Step 1: email ────────────────────────────────────────────── */}
      {step === 'email' && (
        <form onSubmit={checkEmail} className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="text-[13px] text-muted-foreground">Enter your email to continue.</p>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@organisation.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={cn(inputBase, error ? 'border-red-500' : 'border-gray-300 dark:border-zinc-500')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-foreground px-4 py-2.5 text-sm font-medium text-background',
              'transition-opacity hover:opacity-80 disabled:opacity-50',
            )}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</>
              : <><span>Continue</span><ArrowRight className="h-3.5 w-3.5" /></>
            }
          </button>
        </form>
      )}

      {/* ── Step 2: password ─────────────────────────────────────────── */}
      {step === 'credentials' && (
        <form onSubmit={checkCredentials} className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-[13px] text-muted-foreground">
              Signing in as <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <div className="space-y-3">
            <PasswordInput
              name="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              disabled={loading}
              hasError={!!error}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-foreground px-4 py-2.5 text-sm font-medium text-background',
              'transition-opacity hover:opacity-80 disabled:opacity-50',
            )}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</>
              : <><span>Continue</span><ArrowRight className="h-3.5 w-3.5" /></>
            }
          </button>
          <button
            type="button"
            onClick={() => goBack('email')}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Step 3: PIN ──────────────────────────────────────────────── */}
      {step === 'pin' && (
        <form onSubmit={verify} className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Enter your PIN</h2>
            <p className="text-[13px] text-muted-foreground">Enter your 5-digit security PIN.</p>
          </div>
          <div className="space-y-3">
            <PINInput value={pin} onChange={setPin} disabled={loading} autoFocus />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || pin.length < 5}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-foreground px-4 py-2.5 text-sm font-medium text-background',
              'transition-opacity hover:opacity-80 disabled:opacity-50',
            )}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…</>
              : 'Sign In'
            }
          </button>
          <button
            type="button"
            onClick={() => goBack('credentials')}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Step 4: first-login setup ─────────────────────────────────── */}
      {step === 'setup' && (
        <form onSubmit={setupAccount} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Set up your account</h2>
            <p className="text-[13px] text-muted-foreground">
              Create a password and PIN for{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
            <PasswordInput
              name="newPassword"
              placeholder="Min. 8 characters"
              value={newPw}
              onChange={setNewPw}
              disabled={loading}
              autoFocus
            />
            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm password"
              value={confirmPw}
              onChange={setConfirmPw}
              disabled={loading}
              hasError={!!confirmPw && newPw !== confirmPw}
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              5-digit PIN
            </label>
            <PINInput value={newPin} onChange={setNewPin} disabled={loading} />
            <p className="text-[11px] text-muted-foreground">
              This PIN is your second factor — keep it private.
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || newPw.length < 8 || newPw !== confirmPw || newPin.length < 5}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-foreground px-4 py-2.5 text-sm font-medium text-background',
              'transition-opacity hover:opacity-80 disabled:opacity-50',
            )}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Setting up…</>
              : 'Set Up & Sign In'
            }
          </button>

          <button
            type="button"
            onClick={() => goBack('email')}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

    </div>
  );
}
