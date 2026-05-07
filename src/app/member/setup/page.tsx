'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SetupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('t') ?? '';

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0d1526] flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-white/60 text-[15px]">Invalid or missing invite link.</p>
          <p className="text-white/30 text-[13px] mt-2">Please use the link from your invitation email.</p>
        </div>
      </div>
    );
  }

  function handleDigit(digit: string) {
    if (step === 'create') {
      if (pin.length < 6) setPin((p) => p + digit);
    } else {
      if (confirm.length < 6) setConfirm((c) => c + digit);
    }
    setError('');
  }

  function handleDelete() {
    if (step === 'create') setPin((p) => p.slice(0, -1));
    else setConfirm((c) => c.slice(0, -1));
    setError('');
  }

  useEffect(() => {
    if (step === 'create' && pin.length === 6) {
      setStep('confirm');
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirm.length === 6) {
      handleSubmit();
    }
  }, [confirm, step]);

  async function handleSubmit() {
    if (pin !== confirm) {
      setError('PINs do not match. Please try again.');
      setConfirm('');
      setStep('create');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/member/setup-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed.');
        setConfirm('');
        setPin('');
        setStep('create');
        setLoading(false);
        return;
      }
      // Persist group/email so returning logins work without re-entering group ID
      if (data.groupId) localStorage.setItem('af_member_group', data.groupId);
      if (data.email) localStorage.setItem('af_member_email', data.email);
      router.replace('/member/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setConfirm('');
      setPin('');
      setStep('create');
      setLoading(false);
    }
  }

  const activePin = step === 'create' ? pin : confirm;
  const label = step === 'create' ? 'Create a 6-digit PIN' : 'Confirm your PIN';
  const sublabel = step === 'create'
    ? 'You will use this PIN every time you sign in'
    : 'Enter your PIN again to confirm';

  return (
    <div className="min-h-screen bg-[#0d1526] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">ANDA Finance</h1>
          <p className="text-[12px] text-white/40 mt-1 tracking-wide uppercase">Member Portal</p>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[16px] font-semibold text-white mb-1.5 text-center">{label}</p>
          <p className="text-[13px] text-white/40 mb-8 text-center">{sublabel}</p>

          <div className="flex gap-3.5 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${
                  i < activePin.length ? 'bg-white scale-110' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {error && <p className="text-[13px] text-red-400 mb-5 text-center">{error}</p>}
          {loading && <p className="text-[13px] text-white/40 mb-5">Setting up…</p>}

          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => (
              <button
                key={idx}
                onClick={() => { if (k === '⌫') handleDelete(); else if (k) handleDigit(k); }}
                disabled={loading || k === ''}
                className={`
                  h-16 rounded-2xl text-[20px] font-semibold transition-all active:scale-95
                  ${k === '' ? 'invisible' : ''}
                  ${k === '⌫'
                    ? 'bg-white/6 text-white/60 hover:bg-white/10'
                    : 'bg-white/10 text-white hover:bg-white/18'}
                `}
              >
                {k}
              </button>
            ))}
          </div>

          {step === 'confirm' && (
            <button
              onClick={() => { setStep('create'); setPin(''); setConfirm(''); setError(''); }}
              className="mt-8 text-[12px] text-white/30 hover:text-white/50 transition-colors"
            >
              ← Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1526] flex items-center justify-center">
        <p className="text-white/40">Loading…</p>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
