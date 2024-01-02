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
        pkceCodeVerifier: {
            name: 'next-auth.pkce.code_verifier',
            options: {
                httpOnly: true,
                maxAge: undefined,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        sessionToken: {
            name: "next-auth.session-token",
            options: {
                path: "/",
                httpOnly: true,
                maxAge: undefined,
                sameSite: "lax",
                secure: process.env.NODE_ENV === 'production'
            }
        },
        state: {
            name: "next-auth.state",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === 'production',
                maxAge: 900,
            },
    },

    callbacks: {
        async jwt({ token, user }) {
            if (token.id){
                const dbUserResult = await fetchRedis('get', `user:${token?.id}`) as string;
                const dbUser = JSON.parse(dbUserResult) as User
            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image
            }
            }else{ 
                if (user) {
                    token.id = user!.id
                }

                return token
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
