import Image from 'next/image';
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
    <div className="flex min-h-screen">

      {/* ── Left: brand panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden bg-[#0d1526]">

        {/* Background photo */}
        <Image
          src="/photo.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />

        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-[#0d1526]/50" />

        {/* Bottom vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0d1526] to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col p-12">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Logo className="h-6 w-6 text-white/80" />
            <span className="text-[15px] font-semibold tracking-tight text-white/80">
              ANDA Finance
            </span>
          </div>

          {/* Statement */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-[380px] space-y-6">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/35">
                Core Banking System
              </p>
              <h1 className="text-[2.15rem] font-bold leading-[1.2] text-white">
                Powering the future{' '}
                <span className="text-white/60 font-normal italic">of</span>{' '}
                financial services.
              </h1>
              <p className="text-[13px] leading-[1.75] text-white/50">
                SACCOs and microfinance institutions trust{' '}
                <span className="text-white/75 font-medium">ANDA Finance CBS</span>{' '}
                to manage members, streamline transactions, and keep accurate,
                real&#8209;time financial records &mdash; every day.
              </p>
            </div>
          </div>

          {/* Footer line */}
          <p className="text-[11px] tracking-wide text-white/20">
            ANDA Finance CBS &middot; {year}
          </p>

        </div>
      </div>

      {/* ── Right: form panel ─────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-[#f5f6f8] dark:bg-[#111827] px-8 lg:w-[48%]">

        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <Logo className="h-5 w-5 text-foreground" />
          <span className="text-sm font-semibold">ANDA Finance</span>
        </div>

        <LoginForm callbackUrl={callbackUrl} initialEmail={initialEmail} />

      </div>
    </div>
  );
}
