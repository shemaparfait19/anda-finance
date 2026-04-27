import { Logo } from '@/components/icons';
import LoginForm from '@/components/auth/login-form';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? '/';

  return (
    <div className="flex min-h-screen">

      {/* ── Left: brand panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden bg-[#0d1526]">

        {/* Photo backdrop — drop /public/login-bg.jpg to activate */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/login-bg.jpg'), linear-gradient(160deg, #0d1526 0%, #162040 100%)",
          }}
        />
        {/* Dark overlay keeps text readable over any photo */}
        <div className="absolute inset-0 bg-[#0d1526]/65" />
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
            <div className="max-w-[360px] space-y-5">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/35">
                Cooperative Management System
              </p>
              <h1 className="text-[2rem] font-bold leading-[1.25] text-white">
                The financial backbone of Rwanda&apos;s cooperatives.
              </h1>
              <p className="text-[13px] leading-relaxed text-white/50">
                Savings groups, SACCOs, and microfinance institutions trust
                ANDA Finance to manage members, process transactions, and keep
                accurate records — every day.
              </p>
            </div>
          </div>

          {/* Footer line */}
          <p className="text-[11px] tracking-wide text-white/20">
            ANDA Finance · Rwanda · FY 2025–26
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

        <LoginForm callbackUrl={callbackUrl} />

      </div>
    </div>
  );
}
