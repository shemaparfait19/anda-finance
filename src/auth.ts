import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { getUserByEmail, validateOTP, updateUserLastLogin } from '@/lib/auth-service';
import type { UserRole } from '@/lib/types';

// Extend NextAuth session/user types with our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      approvalsRequired: number;
      groupId: string | null;
      groupName: string | null;
    };
  }
  interface User {
    role?: UserRole;
    approvalsRequired?: number;
    groupId?: string | null;
    groupName?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email',    type: 'email' },
        otp:   { label: 'OTP Code', type: 'text'  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const otp   = String(credentials.otp).trim();

        try {
          const isValid = await validateOTP(email, otp);
          if (!isValid) return null;

          const user = await getUserByEmail(email);
          if (!user || !user.isActive) return null;

          // Fire-and-forget last-login update — never block the sign-in
          updateUserLastLogin(user.id).catch(console.error);

          return {
            id:                String(user.id),
            name:              user.name,
            email:             user.email,
            role:              user.role,
            approvalsRequired: user.approvalsRequired,
            groupId:           user.groupId ?? null,
            groupName:         user.groupName ?? null,
          };
        } catch (err) {
          console.error('Auth authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id                = user.id;
        token.role              = (user as any).role;
        token.approvalsRequired = (user as any).approvalsRequired;
        token.groupId           = (user as any).groupId ?? null;
        token.groupName         = (user as any).groupName ?? null;
      }
      return token;
    },
    session({ session, token }) {
      // Cast needed: NextAuth's internal session.user type doesn't include our extensions
      const u = session.user as any;
      u.id                = Number(token.id);
      u.role              = token.role as UserRole;
      u.approvalsRequired = (token.approvalsRequired as number) ?? 1;
      u.groupId           = (token.groupId as string | null) ?? null;
      u.groupName         = (token.groupName as string | null) ?? null;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8-hour sessions
  },
  trustHost: true,
});
