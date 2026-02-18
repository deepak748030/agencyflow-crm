import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socket: Socket | null = null

export const getSocket = (): Socket | null => socket

export const connectSocket = (token: string): Socket => {
    if (socket?.connected) return socket

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
        console.log('Socket.io connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
        console.warn('Socket.io connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason)
    })

    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export const joinConversation = (conversationId: string) => {
    socket?.emit('conversation:join', conversationId)
}

export const leaveConversation = (conversationId: string) => {
    socket?.emit('conversation:leave', conversationId)
}

export const emitTypingStart = (conversationId: string) => {
    socket?.emit('typing:start', { conversationId })
}

export const emitTypingStop = (conversationId: string) => {
    socket?.emit('typing:stop', { conversationId })
}

export const emitMessagesRead = (conversationId: string) => {
    socket?.emit('messages:read', { conversationId })
}
