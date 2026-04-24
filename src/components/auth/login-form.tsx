'use client';

import {
  useState, useRef, useEffect, useCallback,
  type KeyboardEvent, type ClipboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'email' | 'otp';

interface LoginFormProps {
  callbackUrl: string;
}

// ── OTP boxes ────────────────────────────────────────────────────────────────

function OTPInput({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs   = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const update = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const next = [...digits];
    next[i] = char.slice(-1);
    onChange(next.join('').replace(/\s/g, ''));
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      onChange(next.join('').replace(/\s/g, ''));
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    else if   (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next.join(''));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
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

// ── Main form ────────────────────────────────────────────────────────────────

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router       = useRouter();
  const verifyingRef = useRef(false); // prevents double-submit race

  const [step,      setStep]      = useState<Step>('email');
  const [email,     setEmail]     = useState('');
  const [otp,       setOtp]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const fmtCountdown = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;

  const sendOTP = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!email.trim())                                    { setError('Enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp');
        setCountdown(300);
      } else {
        setError(data.message ?? 'Could not send code.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const verify = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length < 6) { setError('Enter all 6 digits.'); return; }
    if (verifyingRef.current) return; // prevent double-submit
    verifyingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, otp, redirect: false });
      if (!res?.ok || res?.error) {
        setError('Incorrect or expired code.');
        setOtp('');
        verifyingRef.current = false;
      } else {
        router.push(callbackUrl);
        router.refresh();
        // don't reset verifyingRef — keep blocking until navigation completes
      }
    } catch {
      setError('Authentication failed — please try again.');
      verifyingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [email, otp, callbackUrl, router]);

  // Auto-submit on 6th digit
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !loading) verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="w-full max-w-[340px]">

      {/* ── Step 1: email ─────────────────────────────────────────────── */}
      {step === 'email' && (
        <form onSubmit={sendOTP} className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="text-[13px] text-muted-foreground">
              Enter your email to receive a one-time code.
            </p>
          </div>

          <div className="space-y-3">
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@organisation.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
                'bg-white text-gray-900 placeholder:text-gray-400',
                'dark:bg-zinc-700 dark:text-white dark:placeholder:text-zinc-400',
                'focus:border-gray-700 dark:focus:border-zinc-300',
                'disabled:opacity-50',
                error
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-zinc-500',
              )}
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
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
              : <><span>Continue</span><ArrowRight className="h-3.5 w-3.5" /></>
            }
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ───────────────────────────────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={verify} className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h2>
            <p className="text-[13px] text-muted-foreground">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-3">
            <OTPInput value={otp} onChange={setOtp} disabled={loading} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg',
              'bg-foreground px-4 py-2.5 text-sm font-medium text-background',
              'transition-opacity hover:opacity-80 disabled:opacity-50',
            )}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying…</>
              : 'Verify & Sign In'
            }
          </button>

          <div className="flex items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>

            {countdown > 0 ? (
              <span className="text-muted-foreground tabular-nums">{fmtCountdown}</span>
            ) : (
              <button
                type="button"
                onClick={() => sendOTP()}
                disabled={loading}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend
              </button>
            )}
          </div>
        </form>
      )}

    </div>
  );
}
