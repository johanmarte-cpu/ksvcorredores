import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt here) — used by middleware.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts (Node runtime, needs Prisma + bcrypt)
  session: { strategy: "jwt" },
};
