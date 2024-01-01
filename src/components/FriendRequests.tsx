"use client"

import { FC, useEffect, useState } from 'react'
import { UserPlus, Check, X } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { pusherClient } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'

interface FriendRequestsProps {
    incomingFriendRequests: IncomingFriendRequest[],
    sessionId: string
}



const FriendRequests: FC<FriendRequestsProps> = ({ incomingFriendRequests, sessionId }) => {
    const router = useRouter()
    const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(incomingFriendRequests)

    useEffect(() => {
        pusherClient.subscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))

        const friendRequestHandler = ({ senderId, senderEmail }: IncomingFriendRequest) => {
            setFriendRequests((prev) => [...prev, { senderId, senderEmail }])
        }
        pusherClient.bind('incoming_friend_requests', friendRequestHandler)

        return () => {
            pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:incoming_friend_requests`))
            pusherClient.unbind('incoming_friend_requests', friendRequestHandler)
        }
    }, [sessionId])

    const acceptFriend = async (senderId: string) => {
        await axios.post('/api/friends/accept', { id: senderId })

        setFriendRequests((prev) => prev.filter((request) => request.senderId === senderId))

        router.refresh();
    }

    const denyFriend = async (senderId: string) => {
        await axios.post('/api/friends/deny', { id: senderId })

        setFriendRequests((prev) => prev.filter((request) => request.senderId === senderId))

        router.refresh();
    }

    return <>
        {friendRequests.length === 0 ? (
            <p className='text-sm text-zinc-500'>Nothing to show here...</p>
        ) : (
            friendRequests.map((request) => (
                <div key={request.senderId} className='flex gap-4 items-center'>

                    <UserPlus className='text-black' />

                    <Image referrerPolicy='no-referrer' className='rounded-full w-8 h-8' src={request.senderPhoto || ''} alt='.' width={0.5} height={0.5} />

                    <p className='font-medium text-lg'>{request.senderEmail}</p>

                    <button aria-label='accept friend' className='w-8 h-8 bg-indigo-600 hover:bg-indigo-700 grid place-items-center rounded-full transition hover:shadow-md' onClick={() => acceptFriend(request.senderId)}>
                        <Check className='font-semibold text-white w-3/4 h-3/4' />
                    </button>

                    <button aria-label='deny friend' className='w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md' onClick={() => denyFriend(request.senderId)}>
                        <X className='font-semibold text-white w-3/4 h-3/4' />
                    </button>

                </div>
            ))
        )}
    </>
}

export default FriendRequests