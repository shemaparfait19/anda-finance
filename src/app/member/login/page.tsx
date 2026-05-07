'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MemberLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'loading' | 'no-group' | 'email' | 'pin'>('loading');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('g') || localStorage.getItem('af_member_group') || '';
    const e = params.get('email') || localStorage.getItem('af_member_email') || '';

    if (g) {
      setGroupId(g);
      if (g) localStorage.setItem('af_member_group', g);
    }
    if (e) {
      setEmail(e);
      if (e) localStorage.setItem('af_member_email', e);
    }

    if (!g) {
      setStep('no-group');
    } else if (e) {
      setStep('pin'); // email already known — go straight to PIN
    } else {
      setStep('email');
    }
  }, []);

  function handlePinKey(digit: string) {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 6) handleLogin(next);
    }
  }

  function handlePinDelete() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  async function handleLogin(pinCode: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/member/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: pinCode, groupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NO_PIN') {
          setError('You haven\'t set up your PIN yet. Please use the invite link from your email.');
        } else {
          setError(data.error || 'Incorrect PIN.');
        }
        setPin('');
        setLoading(false);
        return;
      }
      router.replace('/member/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setPin('');
      setLoading(false);
    }
  }

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    localStorage.setItem('af_member_email', email);
    setError('');
    setStep('pin');
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#0d1526] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1526] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">ANDA Finance</h1>
          <p className="text-[12px] text-white/40 mt-1 tracking-wide uppercase">Member Portal</p>
        </div>

        {/* No group context — member needs to use invite link */}
        {step === 'no-group' && (
          <div className="text-center">
            <div className="h-14 w-14 rounded-full bg-white/6 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">✉</span>
            </div>
            <h2 className="text-[16px] font-semibold text-white mb-2">Check your email</h2>
            <p className="text-[13px] text-white/50 leading-relaxed mb-6">
              Your group administrator has sent you an invitation link to access the member portal.
              Please open that link to get started.
            </p>
            <p className="text-[11px] text-white/25">
              If you already set up your PIN on another device, contact your administrator for a new link.
            </p>
          </div>
        )}

        {/* Email step */}
        {step === 'email' && (
          <form onSubmit={handleEmailNext} className="space-y-4">
            <p className="text-[15px] text-white/70 text-center mb-6">Enter your email to sign in</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              className="w-full bg-white/8 border border-white/12 rounded-xl px-4 py-4 text-[16px] text-white placeholder-white/25 outline-none focus:border-white/30 transition-colors"
            />
            {error && <p className="text-[13px] text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full bg-white text-[#0d1526] py-4 rounded-xl text-[15px] font-semibold hover:bg-white/90 transition-colors"
            >
              Continue →
            </button>
          </form>
        )}

        {/* PIN step */}
        {step === 'pin' && (
          <div className="flex flex-col items-center">
            <p className="text-[15px] text-white/70 mb-1.5 text-center">Enter your PIN</p>
            <p className="text-[13px] text-white/35 mb-8 text-center truncate max-w-[260px]">{email}</p>

            {/* PIN dots */}
            <div className="flex gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${
                    i < pin.length ? 'bg-white scale-110' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-[13px] text-red-400 mb-5 text-center px-4">{error}</p>}
            {loading && (
              <div className="mb-5 flex items-center gap-2 text-white/40">
                <div className="h-4 w-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                <span className="text-[12px]">Signing in…</span>
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => { if (k === '⌫') handlePinDelete(); else if (k) handlePinKey(k); }}
                  disabled={loading || k === ''}
                  className={`
                    h-[60px] rounded-2xl text-[20px] font-semibold transition-all active:scale-95
                    ${k === '' ? 'invisible' : ''}
                    ${k === '⌫'
                      ? 'bg-white/6 text-white/50 hover:bg-white/10'
                      : 'bg-white/10 text-white hover:bg-white/18'}
                  `}
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setStep('email'); setPin(''); setError(''); }}
              className="mt-8 text-[12px] text-white/25 hover:text-white/45 transition-colors"
            >
              Not you? Change email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
