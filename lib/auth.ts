import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for basePath/subdirectory deployments
  // CRITICAL: NextAuth v5 beta needs basePath set to the path it RECEIVES (after Next.js strips basePath)
  // Next.js strips /tms before passing to route handlers, so NextAuth receives /api/auth/session
  // Therefore basePath must be /api/auth (not /tms/api/auth)
  basePath: '/api/auth',
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

        const email = typeof credentials.email === 'string' ? credentials.email.toLowerCase().trim() : '';
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
    async jwt({ token, user, trigger, session: sessionData, request }: { token: any; user?: any; trigger?: string; session?: any; request?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      
      // Read MC number from cookies if available (for persistence across requests)
      if (request) {
        const cookies = request.cookies;
        const mcNumberId = cookies.get('currentMcNumberId')?.value;
        const mcNumber = cookies.get('currentMcNumber')?.value;
        if (mcNumberId && mcNumber) {
          token.mcNumberId = mcNumberId;
          token.mcNumber = mcNumber;
        } else if (!mcNumberId && !mcNumber) {
          // Clear MC number if cookies are not set
          delete token.mcNumberId;
          delete token.mcNumber;
        }
      }
      
      // Update token when session is updated (e.g., when switching company/MC number)
      if (trigger === 'update' && sessionData) {
        if (sessionData.user?.currentCompanyId) {
          token.currentCompanyId = sessionData.user.currentCompanyId;
        }
        if (sessionData.user?.mcNumberId !== undefined) {
          token.mcNumberId = sessionData.user.mcNumberId;
        }
        if (sessionData.user?.mcNumber !== undefined) {
          token.mcNumber = sessionData.user.mcNumber;
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        if (token.currentCompanyId) {
          session.user.currentCompanyId = token.currentCompanyId as string;
        }
        if (token.mcNumberId) {
          session.user.mcNumberId = token.mcNumberId as string;
        }
        if (token.mcNumber) {
          session.user.mcNumber = token.mcNumber as string;
        }
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

