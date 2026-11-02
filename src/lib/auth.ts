import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "NIM / Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = String(credentials.identifier).trim();
        const password = String(credentials.password);

        // Find user by username, nim, or email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: identifier },
              { nim: identifier },
              { email: identifier },
            ],
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("Akun Anda dinonaktifkan. Silakan hubungi Administrator.");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          nim: user.nim,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as unknown as { role: UserRole }).role;
        token.nim = (user as unknown as { nim: string | null }).nim;
        token.username = (user as unknown as { username: string }).username;
        token.fullName = (user as unknown as { fullName: string }).fullName;
        token.avatarUrl = (user as unknown as { avatarUrl: string | null }).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.nim = token.nim as string | null;
        session.user.username = token.username as string;
        session.user.fullName = token.fullName as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
  },
});
