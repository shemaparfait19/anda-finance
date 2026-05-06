import Link from 'next/link';
import { Logo } from '@/components/icons';
import LoginForm from '@/components/auth/login-form';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params       = await searchParams;
  const callbackUrl  = params.callbackUrl ?? '/';
  const initialEmail = params.email ?? '';
  const year         = new Date().getFullYear();

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#0d1526] bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.ibb.co/5gd8J707/Gemini-Generated-Image-pdb9znpdb9znpdb9.png')" }}
    >
      {/* Full-page dim */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ── Card ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-[860px] shadow-2xl overflow-hidden min-h-[520px]">

        {/* ── Left: brand panel ─────────────────────────────────────── */}
        <div className="hidden md:flex md:w-[380px] shrink-0 flex-col justify-between p-10 bg-[#0d1526]/85">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Logo className="h-6 w-6 text-white" />
            <span className="text-[15px] font-semibold tracking-tight text-white">
              ANDA Finance
            </span>
          </div>

          {/* Statement */}
          <div className="space-y-5">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/50">
              Core Banking System
            </p>
            <h1 className="text-[1.85rem] font-bold leading-[1.2] text-white">
              Powering the future{' '}
              <span className="text-white/55 font-normal italic">of</span>{' '}
              financial services.
            </h1>
            <p className="text-[13px] leading-[1.75] text-white/65">
              Savings groups, SACCOs, investment funds, and microfinance institutions trust{' '}
              <span className="text-white font-medium">ANDA Finance CBS</span>{' '}
              to manage members, process &amp; streamline transactions, and keep accurate,
              real-time financial records—every day.
            </p>
          </div>

          {/* Footer */}
          <p className="text-[11px] tracking-wide text-white/30">
            ANDA Finance CBS &middot; {year}
          </p>
        </div>

        {/* ── Right: form panel ─────────────────────────────────────── */}
        <div className="flex-1 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center px-8 py-12">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <Logo className="h-5 w-5 text-foreground" />
            <span className="text-sm font-semibold">ANDA Finance</span>
          </div>

          <LoginForm callbackUrl={callbackUrl} initialEmail={initialEmail} />

          <div className="mt-8 text-center">
            <Link
              href="/about"
              className="text-[11.5px] text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors tracking-wide"
            >
              What is ANDA Finance? →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
