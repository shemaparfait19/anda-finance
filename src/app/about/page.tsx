import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/icons';

export const metadata: Metadata = {
  title: 'About ANDA Finance — Core Banking System',
  description:
    'ANDA Finance is a professional Core Banking System for savings groups, SACCOs, and microfinance institutions in Rwanda.',
};

const FEATURES = [
  {
    id: '01',
    title: 'Member Registry',
    desc: 'Onboard members, maintain complete profiles, track savings accounts and loan history — all linked to a unique member ID.',
  },
  {
    id: '02',
    title: 'Savings & Deposits',
    desc: 'Record individual deposits or process bulk uploads. Track principal, interest earned, and total balances in real time.',
  },
  {
    id: '03',
    title: 'Loan Management',
    desc: 'Issue loans, generate amortization schedules, record repayments, and monitor outstanding balances and arrears.',
  },
  {
    id: '04',
    title: 'Payments & Transfers',
    desc: 'Process inter-account transfers, load mirror accounts, and maintain a full cashbook of every financial movement.',
  },
  {
    id: '05',
    title: 'Reports & Statements',
    desc: 'Export member statements, group summaries, loan portfolios, and arrears lists as PDF, Excel, or CSV — on demand.',
  },
  {
    id: '06',
    title: 'Audit & Compliance',
    desc: 'Every action is logged with a timestamp, user attribution, and optional maker/checker approval before it takes effect.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Register your institution',
    desc: 'An administrator creates the group, configures settings, and invites staff with the appropriate access level.',
  },
  {
    n: '2',
    title: 'Onboard your members',
    desc: 'Add member profiles, open savings accounts, and import opening balances from your existing records.',
  },
  {
    n: '3',
    title: 'Run day-to-day operations',
    desc: 'Record deposits, issue and track loans, process payments, and generate reports whenever you need them.',
  },
];

const WHO = ['Savings Groups\n(Ibimina)', 'SACCOs', 'Investment Clubs', 'Microfinance\nInstitutions'];

const FAQS = [
  {
    q: 'Who is ANDA Finance built for?',
    a: 'ANDA Finance is designed for savings groups (ibimina), SACCOs, microfinance institutions, and investment clubs of any size. If your organisation pools money, lends to members, and needs accurate records — this is for you.',
  },
  {
    q: 'Is it secure?',
    a: 'Yes. Every login requires both a password and a 5-digit PIN, giving you two-factor authentication by default. Every user action is recorded in a tamper-evident audit log, and role-based permissions control exactly what each person can see or do.',
  },
  {
    q: 'Can multiple groups use the same platform?',
    a: 'Yes. ANDA Finance is a multi-tenant system. Each group operates in a fully isolated environment — members, accounts, and transactions are never visible across organisations.',
  },
  {
    q: 'What currency and language does it support?',
    a: 'ANDA Finance is configured for Rwandan Francs (RWF) and English. The platform is designed to be adaptable to other currencies and locales as your needs grow.',
  },
  {
    q: 'How are loans managed from application to closure?',
    a: 'Loans move through a full lifecycle: application → approval (with optional maker/checker review) → disbursement → repayment tracking → automatic closure. Amortization schedules are generated based on the loan amount, term, and interest rate.',
  },
  {
    q: 'How do I get access?',
    a: 'Contact your group administrator — they manage user accounts and onboarding. Once your account is created, you will receive a setup link to create your password and 5-digit PIN.',
  },
];

const year = new Date().getFullYear();

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0d1526] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between h-14">
          <Link href="/about" className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 text-white" />
            <span className="text-[14px] font-semibold tracking-tight text-white">
              ANDA Finance
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded border border-white/20 px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/8 transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-[#0d1526] px-5 sm:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/30 mb-7">
            Core Banking System
          </p>
          <h1 className="text-[2.4rem] md:text-[3.2rem] font-bold text-white leading-[1.08] tracking-tight mb-6 max-w-2xl">
            Built for the financial work that keeps your group running.
          </h1>
          <p className="text-[16px] md:text-[17px] leading-[1.78] text-white/55 max-w-lg mb-10">
            ANDA Finance is a full-featured Core Banking System for savings groups, SACCOs, and microfinance institutions.
            Manage members, process transactions, track loans, and generate reports — all in one place.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#0d1526] px-5 py-2.5 rounded text-[13px] font-semibold hover:bg-white/92 transition-colors"
            >
              Sign In to your account
            </Link>
            <a
              href="#features"
              className="text-[13px] text-white/45 hover:text-white/75 transition-colors"
            >
              See what&apos;s included ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-5 sm:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#2A7886] mb-3">
              What&apos;s included
            </p>
            <h2 className="text-[1.85rem] font-bold text-[#0d1526] tracking-tight">
              The complete financial cycle, end to end.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 md:divide-y-0 md:[&>*:nth-child(n+4)]:border-t md:[&>*:nth-child(n+4)]:border-gray-100 lg:[&>*:nth-child(n+4)]:border-t lg:divide-x lg:divide-gray-100 lg:[&>*:nth-child(3n+1)]:border-l-0 shadow-sm">
            {FEATURES.map((f) => (
              <div key={f.id} className="bg-white p-8 md:p-9 hover:bg-gray-50/70 transition-colors">
                <p className="text-[10px] font-mono text-gray-300 mb-4 tracking-widest">{f.id}</p>
                <h3 className="text-[14.5px] font-semibold text-[#0d1526] mb-2.5">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.68] text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-[#f7f8f9] border-y border-gray-100 px-5 sm:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#2A7886] mb-3">
              Getting started
            </p>
            <h2 className="text-[1.85rem] font-bold text-[#0d1526] tracking-tight">How it works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-5">
                <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full border-2 border-[#0d1526]/20 flex items-center justify-center">
                  <span className="text-[12px] font-bold text-[#0d1526]/60">{step.n}</span>
                </div>
                <div>
                  <h3 className="text-[14.5px] font-semibold text-[#0d1526] mb-2">{step.title}</h3>
                  <p className="text-[13.5px] leading-[1.68] text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────── */}
      <section className="bg-[#0d1526] px-5 sm:px-8 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] text-white/30 mb-8 tracking-wide">Used by institutions including</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WHO.map((name) => (
              <div
                key={name}
                className="border border-white/8 rounded-lg px-5 py-5 hover:border-white/16 transition-colors"
              >
                <p className="text-[13.5px] font-medium text-white/70 whitespace-pre-line leading-snug">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 sm:px-8 py-20 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#2A7886] mb-3">
              FAQ
            </p>
            <h2 className="text-[1.85rem] font-bold text-[#0d1526] tracking-tight">
              Common questions
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-5 cursor-pointer">
                <summary className="flex items-start justify-between gap-4 list-none outline-none [&::-webkit-details-marker]:hidden select-none">
                  <span className="text-[14.5px] font-semibold text-[#0d1526] leading-snug pt-px">
                    {faq.q}
                  </span>
                  <span className="flex-shrink-0 mt-px text-[18px] leading-none text-gray-300 group-open:text-gray-500 group-open:rotate-45 transition-all duration-200">
                    +
                  </span>
                </summary>
                <p className="mt-3.5 text-[13.5px] leading-[1.72] text-gray-500 pr-8">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="bg-[#f7f8f9] border-t border-gray-100 px-5 sm:px-8 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[1.6rem] font-bold text-[#0d1526] tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-[14px] text-gray-500 mb-7">
            Sign in with your account, or contact your group administrator to request access.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#0d1526] text-white px-6 py-3 rounded text-[13px] font-semibold hover:bg-[#162036] transition-colors"
          >
            Sign In to ANDA Finance
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-[#0d1526] border-t border-white/5 px-5 sm:px-8 py-9">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo className="h-4 w-4 text-white/25" />
            <span className="text-[12px] text-white/25 tracking-wide">ANDA Finance CBS</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-white/25">
            <span>© {year}</span>
            <span className="text-white/10">·</span>
            <span>Savings &amp; Microfinance Institution</span>
            <span className="text-white/10">·</span>
            <Link href="/login" className="hover:text-white/50 transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
