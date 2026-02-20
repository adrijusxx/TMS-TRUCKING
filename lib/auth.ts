import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

import bcrypt from 'bcryptjs';

// Validate and set NEXTAUTH_SECRET
// In production on AWS, this is loaded from AWS Secrets Manager via initialization
// @see lib/secrets/initialize.ts
// If not set, generate a default one (for development only - NOT recommended for production)
let nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!nextAuthSecret) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using a default secret (NOT SECURE FOR PRODUCTION!)');
  // Generate a simple default secret for development
  // In production, this should ALWAYS be set in environment variables
  nextAuthSecret = 'dev-secret-key-change-in-production-min-32-chars';
  console.warn('⚠️  Please set NEXTAUTH_SECRET in your .env.local file for production use.');
}

export const authOptions: NextAuthConfig = {
  secret: nextAuthSecret,
  trustHost: true, // Required for proxy/ALB deployments
  // basePath is derived from AUTH_URL/NEXTAUTH_URL automatically
  // Setting it explicitly while NEXTAUTH_URL has a pathname causes env-url-basepath-mismatch warning
  logger: { warn: (code) => { if (code !== 'env-url-basepath-mismatch') console.warn(`[auth][warn] ${code}`); } },
  basePath: '/api/auth',
  // Use non-secure cookies when behind ALB proxy (ALB terminates SSL)
  // The __Secure- and __Host- prefixes don't work when app receives HTTP from ALB
  useSecureCookies: false,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, request): Promise<{ id: string; email: string; name: string; role: string; roleId?: string; roleSlug: string; roleName: string; companyId: string; mcAccess: string[] } | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = typeof credentials.email === 'string' ? credentials.email.toLowerCase().trim() : '';
          const password = typeof credentials.password === 'string' ? credentials.password : '';

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              roleId: true,
              customRole: { select: { id: true, slug: true, name: true } },
              companyId: true,
              mcAccess: true,
              isActive: true,
              password: true,
              tempPassword: true, // Include tempPassword to clear it after login
              company: {
                select: {
                  id: true,
                  name: true
                }
              },
              // Fetch all driver profiles (multi-company support)
              drivers: {
                select: {
                  id: true,
                  companyId: true,
                  driverNumber: true
                }
              },
              // Fetch all company associations
              userCompanies: {
                select: {
                  companyId: true,
                  role: true,
                  createdAt: true
                },
                orderBy: {
                  createdAt: 'desc' // Newest first
                }
              }
            }
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

          // Clear tempPassword after successful login (security: password was used)
          if (user.tempPassword) {
            await prisma.user.update({
              where: { id: user.id },
              data: { tempPassword: null },
            });
          }

          // Determine effective company ID
          let effectiveCompanyId = user.companyId;

          // For DRIVERS: Default to the newest company assignment if available
          // This handles cases where a driver works for multiple companies or switches companies
          if (user.role === 'DRIVER' && user.userCompanies && user.userCompanies.length > 0) {
            // userCompanies is already ordered by createdAt desc in the query
            effectiveCompanyId = user.userCompanies[0].companyId;
          }

          // Determine role info from custom Role table or fallback to legacy enum
          const roleSlug = user.customRole?.slug || user.role.toLowerCase().replace('_', '-');
          const roleName = user.customRole?.name || user.role;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role, // legacy enum, kept for backward compat
            roleId: user.roleId || undefined,
            roleSlug,
            roleName,
            companyId: effectiveCompanyId, // Use the determined company ID
            mcAccess: user.mcAccess || []
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData, request }: { token: any; user?: any; trigger?: string; session?: any; request?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // legacy enum
        token.roleId = user.roleId;
        token.roleSlug = user.roleSlug;
        token.roleName = user.roleName;
        token.companyId = user.companyId;
        token.mcAccess = user.mcAccess || [];
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
        if (sessionData.user?.mcAccess !== undefined) {
          token.mcAccess = sessionData.user.mcAccess;
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string; // legacy enum
        session.user.roleId = token.roleId as string | undefined;
        session.user.roleSlug = (token.roleSlug as string) || token.role?.toString().toLowerCase().replace('_', '-') || '';
        session.user.roleName = (token.roleName as string) || token.role?.toString() || '';
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
        if (token.mcAccess) {
          session.user.mcAccess = token.mcAccess as string[];
        } else {
          session.user.mcAccess = [];
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


export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
