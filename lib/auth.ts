import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      fullName?: string | null;
      role: string;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    passwordChangedAt?: number | null;
  }
}
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/dang-nhap",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
        const u = await prisma.user.findUnique({ where: { id: user.id as string }, select: { passwordChangedAt: true } });
        (token as unknown as Record<string, unknown>).passwordChangedAt = u?.passwordChangedAt?.getTime() ?? null;
      } else if (token.id) {
        // Token refresh — verify user still exists
        const u = await prisma.user.findUnique({ where: { id: token.id as string }, select: { id: true } });
        if (!u) {
          (token as unknown as Record<string, unknown>).id = undefined;
          (token as unknown as Record<string, unknown>).role = undefined;
          (token as unknown as Record<string, unknown>).passwordChangedAt = null;
        }
      }
      const pwAt = (token as unknown as Record<string, unknown>).passwordChangedAt as number | undefined;
      if (pwAt && token.iat && pwAt > (token.iat as number) * 1000) {
        (token as unknown as Record<string, unknown>).id = undefined;
        (token as unknown as Record<string, unknown>).role = undefined;
        (token as unknown as Record<string, unknown>).passwordChangedAt = null;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role) return session; // password was changed, session invalidated
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
