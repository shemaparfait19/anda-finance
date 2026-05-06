import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextTopLoader from "nextjs-toploader";
import { SplashScreen } from "@/components/splash-screen";

export const metadata: Metadata = {
  title: "ANDA Finance System",
  description: "Core Banking System for saving & lending groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Apply dark mode only when the user has explicitly chosen it — never follow OS preference */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('theme') === 'dark') {
              document.documentElement.classList.add('dark');
            }
          } catch(_) {}
        `}} />
      </head>
      <body className="font-sans antialiased">
        <SplashScreen />
        <NextTopLoader color="#e05c2a" height={2} showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
