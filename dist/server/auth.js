import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                var _a;
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }
                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                });
                if (!user) {
                    return null;
                }
                const valid = await compare(parsed.data.password, user.passwordHash);
                if (!valid) {
                    return null;
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: (_a = user.avatar) !== null && _a !== void 0 ? _a : undefined,
                };
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!(auth === null || auth === void 0 ? void 0 : auth.user);
            const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
            if (isAuthPage) {
                if (isLoggedIn)
                    return Response.redirect(new URL("/", nextUrl));
                return true;
            }
            return isLoggedIn;
        },
        jwt: async ({ token, user }) => {
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (session.user) {
                session.user.id = token.userId;
            }
            return session;
        },
    },
});
