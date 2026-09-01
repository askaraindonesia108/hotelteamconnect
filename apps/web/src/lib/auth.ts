import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@team-connect/database';
import { verify } from '@node-rs/argon2';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' }, // JWT mutlak diperlukan untuk Credentials provider
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Pastikan user ada dan statusnya aktif
        if (!user || !user.isActive) return null;

        const isValidPassword = await verify(user.password, password);
        if (!isValidPassword) return null;

        // Kembalikan data yang akan disimpan ke dalam JWT token
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          propertyId: user.propertyId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.propertyId = user.propertyId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        // Penambahan 'as string' untuk mengatasi error TypeScript 'unknown'
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.propertyId = token.propertyId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});