import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "65726e69-7873-742d-666c-75782d736563", // Static fallback to prevent Configuration error
  trustHost: true,
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect error to login page
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("Credentials validation failed:", parsed.error);
            return null;
          }

          console.log("Attempting to find user:", parsed.data.email);
          const user = await User.findByEmail(parsed.data.email);
          
          if (!user) {
            console.log("User not found:", parsed.data.email);
            return null;
          }
          
          console.log("User found, verifying password...");
          const valid = await compare(parsed.data.password, user.password_hash);
          if (!valid) {
            console.log("Invalid password for user:", parsed.data.email);
            return null;
          }

          console.log("Authentication successful for:", parsed.data.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar ?? undefined,
          };
        } catch (error: any) {
          console.error("Authorization error:", error);
          throw error; // Re-throw to let NextAuth handle it
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.image = user.image;
      }
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.image = session.image || session.avatar || token.image;
        console.log("JWT Update trigger:", { name: token.name, image: token.image });
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.avatar = token.image as string;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
