import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextTopLoader from "nextjs-toploader";

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
        {/* Prevent dark-mode flash before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(_) {}
        `}} />
      </head>
      <body className="font-sans antialiased">
        <NextTopLoader color="#e05c2a" height={2} showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
