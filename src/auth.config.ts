import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config — no DB imports.
 * Used by middleware to verify sessions without hitting Node.js-only APIs.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  providers: [], // Providers added in auth.ts (Node.js runtime only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Always allow NextAuth internal routes and public API routes
      if (pathname.startsWith('/api/auth')) return true;
      if (pathname === '/api/send-otp') return true;
      if (pathname === '/api/verify-credentials') return true;
      if (pathname === '/api/check-login-status') return true;
      if (pathname === '/api/setup-credentials') return true;

      // Redirect logged-in users away from the login page
      if (isLoggedIn && pathname === '/login') {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Require login for everything else
      if (!isLoggedIn && pathname !== '/login') {
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
};
