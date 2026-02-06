import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

// Get secret from environment - must match middleware
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: authSecret,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }


        const email = credentials.email as string;
        const password = credentials.password as string;

        // Demo mode - allow test accounts without database
        const demoUsers: Record<string, { id: string; name: string; role: string; password: string }> = {
          'admin@dafc.com': { id: 'demo-admin', name: 'Admin User', role: 'ADMIN', password: 'admin123' },
          'planner@dafc.com': { id: 'demo-planner', name: 'OTB Planner', role: 'PLANNER', password: 'planner123' },
          'manager@dafc.com': { id: 'demo-manager', name: 'Brand Manager', role: 'BRAND_MANAGER', password: 'manager123' },
          'buyer@dafc.com': { id: 'demo-buyer', name: 'Buyer User', role: 'BUYER', password: 'buyer123' },
        };

        const demoUser = demoUsers[email];
        if (demoUser && password === demoUser.password) {
          return {
            id: demoUser.id,
            email: email,
            name: demoUser.name,
            role: demoUser.role,
            image: null,
          };
        }

        // Production mode - check database (lazy import to avoid connection issues)
        try {
          const { default: prisma } = await import('./prisma');
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              assignedBrands: true,
            },
          });

          if (!user) {
            return null;
          }

          if (user.status !== 'ACTIVE') {
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar,
          };
        } catch (error) {
          console.error('Database error during auth:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
});

declare module 'next-auth' {
  interface User {
    role?: string;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string | null;
    };
    accessToken?: string;
  }
}
