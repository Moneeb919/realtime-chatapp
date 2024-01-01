import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id: idToRem } = z.object({ id: z.string() }).parse(body);

        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response('Unauthorized', { status: 401 })
        }

        // need to be in friend requests
        const hasFriendRequest = await fetchRedis('sismember', `user:${session.user.id}:income_friend_requests`, idToRem);

        if (!hasFriendRequest) {
            return new Response('You cannot remove this user!', { status: 400 })
        }

        await db.srem(`user:${session.user.id}:income_friend_requests`, idToRem);

        return new Response('OK');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response('Invalid request payload', { status: 422 })
        }

        return new Response('Invalid request', { status: 400 });
    }
}