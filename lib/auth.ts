import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for basePath/subdirectory deployments
  // DO NOT set basePath here - NextAuth v5 auto-detects from NEXTAUTH_URL
  // When Next.js has basePath, it strips it before passing to route handlers
  // NextAuth receives /api/auth/session (not /tms/api/auth/session)
  // Setting basePath here causes "UnknownAction" errors
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, request): Promise<{ id: string; email: string; name: string; role: UserRole; companyId: string } | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = typeof credentials.email === 'string' ? credentials.email : '';
        const password = typeof credentials.password === 'string' ? credentials.password : '';

        const user = await prisma.user.findUnique({
          where: { email },
          include: { company: true }
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          companyId: user.companyId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // baseUrl already includes basePath from NEXTAUTH_URL (e.g., http://34.121.40.233/tms)
      // So we just need to append the relative URL to it
      
      // If url is relative, append it to baseUrl
      if (url.startsWith('/')) {
        // baseUrl already has the basePath, so just append the url
        return `${baseUrl}${url}`;
      }
      
      // If url is absolute, check if it's on the same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (e) {
        // Invalid URL, fall through to return baseUrl
      }
      
      // Default: return baseUrl (which includes basePath from NEXTAUTH_URL)
      return baseUrl;
    }
  },
  pages: {
    // signIn path will be relative to basePath automatically
    signIn: '/login',
    // Error page - NextAuth will use this when there's an auth error
    // The basePath will be automatically prepended by Next.js
    error: '/api/auth/error',
  },
  session: {
    strategy: 'jwt'
  }
};

