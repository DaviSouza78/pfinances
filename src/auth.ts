import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { whitelistEmails } from "./config/whitelist";
import prisma from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly",
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      const isAllowed = whitelistEmails.includes(user.email);
      if (!isAllowed) {
        console.warn(`Tentativa de login não autorizada de: ${user.email}`);
        return false;
      }

      // Sincronizar usuário com banco de dados
      try {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
            }
          });
        }
        // Associar o id do banco ao objeto do NextAuth para propagar no token/session
        user.id = dbUser.id;
      } catch (error) {
        console.error("Erro ao sincronizar usuário no banco durante o login:", error);
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error", // Redireciona para nossa tela customizada de erro em caso de bloqueio
  },
  secret: process.env.AUTH_SECRET,
});
