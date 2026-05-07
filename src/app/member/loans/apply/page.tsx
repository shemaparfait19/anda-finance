'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileShell } from '@/components/member/mobile-shell';

type AmortRow = { month: number; payment: number; principal: number; interest: number; balance: number };

function calcAmortization(principal: number, annualRate: number, termMonths: number): AmortRow[] {
  if (!principal || !annualRate || !termMonths) return [];
  const r = annualRate / 100 / 12;
  const pmt = r === 0
    ? principal / termMonths
    : (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);

  const rows: AmortRow[] = [];
  let balance = principal;
  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * r;
    const principalPaid = pmt - interest;
    balance = Math.max(balance - principalPaid, 0);
    rows.push({
      month: i,
      payment: Math.round(pmt),
      principal: Math.round(principalPaid),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }
  return rows;
}

type Step = 'calculator' | 'review' | 'confirm' | 'done';

const PURPOSES = ['Business', 'Education', 'Agriculture', 'Housing', 'Healthcare', 'Personal', 'Other'];

export default function LoanApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('calculator');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [term, setTerm] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeDesc, setPurposeDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const rows = calcAmortization(Number(principal), Number(rate), Number(term));
  const totalPayment = rows.reduce((s, r) => s + r.payment, 0);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const monthlyPayment = rows[0]?.payment ?? 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/member/loan-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: Number(principal), interestRate: Number(rate), loanTerm: Number(term), purpose, purposeDescription: purposeDesc }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); setSubmitting(false); return; }
      setStep('done');
    } catch { setError('Network error.'); setSubmitting(false); }
  }

  if (step === 'done') {
    return (
      <MobileShell>
        <div className="min-h-screen bg-[#0d1526] flex flex-col items-center justify-center px-6 pb-20">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <h2 className="text-[20px] font-bold text-white mb-2 text-center">Application Submitted</h2>
          <p className="text-[14px] text-white/50 text-center mb-8">
            Your loan application has been received and is pending review by your group administrator.
          </p>
          <button
            onClick={() => router.push('/member/loans')}
            className="bg-white text-[#0d1526] px-8 py-3.5 rounded-xl text-[14px] font-semibold"
          >
            Back to Loans
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="bg-[#0d1526] px-5 pt-12 pb-6">
        <button onClick={() => step === 'calculator' ? router.back() : setStep(step === 'confirm' ? 'review' : 'calculator')}
          className="text-[13px] text-white/50 mb-4 flex items-center gap-1">
          ← {step === 'calculator' ? 'Back' : 'Edit'}
        </button>
        <h1 className="text-[22px] font-bold text-white mb-1">Apply for a Loan</h1>
        <p className="text-[13px] text-white/40">
          {step === 'calculator' ? 'Enter loan details to preview repayment schedule'
           : step === 'review' ? 'Review your amortization schedule'
           : 'Confirm and submit your application'}
        </p>
      </div>

      <div className="bg-[#f7f8f9] rounded-t-3xl min-h-screen px-4 pt-6 pb-8">

        {/* STEP 1 — Calculator */}
        {step === 'calculator' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Loan Amount (RWF)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="e.g. 500000"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[16px] text-[#0d1526] outline-none focus:border-[#0d1526] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 12"
                step="0.1"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[16px] text-[#0d1526] outline-none focus:border-[#0d1526] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Loan Term (months)
              </label>
              <div className="flex gap-2">
                {[6, 12, 18, 24, 36].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTerm(String(m))}
                    className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                      term === String(m)
                        ? 'bg-[#0d1526] text-white border-[#0d1526]'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Or type custom months"
                className="w-full mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-[#0d1526] outline-none focus:border-[#0d1526] transition-colors"
              />
            </div>

            {rows.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-2">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Monthly</p>
                    <p className="text-[16px] font-bold text-[#0d1526]">{monthlyPayment.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">RWF</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Total Interest</p>
                    <p className="text-[16px] font-bold text-orange-600">{totalInterest.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">RWF</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Total Cost</p>
                    <p className="text-[16px] font-bold text-[#0d1526]">{totalPayment.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">RWF</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('review')}
              disabled={rows.length === 0}
              className="w-full bg-[#0d1526] text-white py-4 rounded-2xl text-[15px] font-semibold mt-2 disabled:opacity-40 transition-opacity active:opacity-80"
            >
              View Full Schedule →
            </button>
          </div>
        )}

        {/* STEP 2 — Amortization review */}
        {step === 'review' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-5 text-center">
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Principal</p>
                <p className="text-[14px] font-bold text-[#0d1526]">{Number(principal).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Rate</p>
                <p className="text-[14px] font-bold text-[#0d1526]">{rate}%</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Term</p>
                <p className="text-[14px] font-bold text-[#0d1526]">{term} mo</p>
              </div>
            </div>

            {/* Amortization table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
              <div className="grid grid-cols-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                {['Mo.','Payment','Interest','Balance'].map((h) => (
                  <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
                {rows.map((r) => (
                  <div key={r.month} className="grid grid-cols-4 px-4 py-2.5">
                    <p className="text-[12px] text-gray-400">{r.month}</p>
                    <p className="text-[12px] font-medium text-[#0d1526]">{r.payment.toLocaleString()}</p>
                    <p className="text-[12px] text-orange-500">{r.interest.toLocaleString()}</p>
                    <p className="text-[12px] text-gray-500">{r.balance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-[11px] font-semibold text-gray-500">Total</p>
                <p className="text-[11px] font-semibold text-[#0d1526]">{totalPayment.toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-orange-500">{totalInterest.toLocaleString()}</p>
                <p className="text-[11px] text-gray-400">—</p>
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full bg-[#0d1526] text-white py-4 rounded-2xl text-[15px] font-semibold active:opacity-80 transition-opacity"
            >
              Proceed to Apply →
            </button>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[13px] font-semibold text-[#0d1526] mb-3">Loan Summary</h3>
              <div className="space-y-2">
                {[
                  ['Amount', `${Number(principal).toLocaleString()} RWF`],
                  ['Interest Rate', `${rate}% p.a.`],
                  ['Term', `${term} months`],
                  ['Monthly Payment', `${monthlyPayment.toLocaleString()} RWF`],
                  ['Total Repayable', `${totalPayment.toLocaleString()} RWF`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <p className="text-[13px] text-gray-400">{k}</p>
                    <p className="text-[13px] font-medium text-[#0d1526]">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Loan Purpose
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPurpose(p)}
                    className={`px-3.5 py-2 rounded-xl text-[12px] font-medium border transition-colors ${
                      purpose === p
                        ? 'bg-[#0d1526] text-white border-[#0d1526]'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={purposeDesc}
                onChange={(e) => setPurposeDesc(e.target.value)}
                placeholder="Briefly describe how you will use the loan…"
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-[#0d1526] outline-none focus:border-[#0d1526] transition-colors resize-none"
              />
            </div>

            {error && <p className="text-[13px] text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !purpose}
              className="w-full bg-[#0d1526] text-white py-4 rounded-2xl text-[15px] font-semibold disabled:opacity-40 active:opacity-80 transition-opacity"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Your application will be reviewed by your group administrator before approval.
            </p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
