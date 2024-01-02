import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google"
import { fetchRedis } from "@/helpers/redis";

function getGoogleCredentials() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || clientId.length == 0) {
        throw new Error('Missing google client id');
    }
    if (!clientSecret || clientSecret.length == 0) {
        throw new Error('Missing google client secret');
    }

    return { clientId, clientSecret }
}

export const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret
        }),
    ],
    cookies: {
        sessionToken: {
            name: 'next-auth.session-token',
            options: {
                // Set the Secure flag to ensure the cookie is only sent over HTTPS
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            const dbUserResult = await fetchRedis('get', `user:${token.id}`) as | string | null;
            if (!dbUserResult) {
                if (user) {
                    token.id = user!.id
                }

                return token
            }

            const dbUser = JSON.parse(dbUserResult) as User
            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image
            }
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id,
                    session.user.name = token.name,
                    session.user.email = token.email,
                    session.user.image = token.picture
            }
            return session
        },

        redirect() {
            return '/dashboard'
        },
    },
    secret: process.env.NEXTAUTH_SECRET
    // secret: process.env.NEXTAUTH_SECRET

}