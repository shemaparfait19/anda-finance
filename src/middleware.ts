import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Use the edge-safe config so middleware runs without Node.js DB imports
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match every path except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
