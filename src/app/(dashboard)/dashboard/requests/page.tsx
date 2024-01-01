import { fetchRedis } from '@/helpers/redis';
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import FriendRequests from '@/components/FriendRequests';

const page = async ({ }) => {

    const session = await getServerSession(authOptions);
    if (!session) {
        return new Error('Unauthorized');
    }

    const requestedIds = await fetchRedis('smembers', `user:${session.user.id}:incoming_friend_requests`);

    const incomingFriendRequests = await Promise.all(requestedIds.map(async (senderId: string) => {
        const sender = (await fetchRedis('get', `user:${senderId}`)) as string
        const senderParsed = JSON.parse(sender) as User
        return {
            senderId,
            senderEmail: senderParsed.email as string,
            senderPhoto: senderParsed.image
        }
    }))

    return <main className='pt-8'>
        <h1 className='font-bold text-5xl mb-8'>Add a Friend</h1>
        <div className='flex flex-col gap-4'></div>
        <FriendRequests incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id} />
    </main>
}

export default page