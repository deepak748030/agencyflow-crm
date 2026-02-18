import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Loader2, ArrowLeft, Users, Search, Hash } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
    getConversations, getConversationMessages, sendMessage,
    type Conversation, type ChatMessage
} from '../lib/api'

export function ChatPage() {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileChat, setShowMobileChat] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        fetchConversations()
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [])

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation._id)
            // Poll for new messages every 3 seconds
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = setInterval(() => {
                fetchMessages(activeConversation._id, true)
            }, 3000)
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [activeConversation?._id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchConversations = async () => {
        try {
            const res = await getConversations()
            if (res.success) setConversations(res.response)
        } catch (err) {
            console.error('Failed to fetch conversations:', err)
        } finally { setLoading(false) }
    }

    const fetchMessages = async (conversationId: string, silent = false) => {
        if (!silent) setMessagesLoading(true)
        try {
            const res = await getConversationMessages(conversationId)
            if (res.success) setMessages(res.response.messages)
        } catch (err) {
            console.error('Failed to fetch messages:', err)
        } finally { if (!silent) setMessagesLoading(false) }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !activeConversation || sending) return
        setSending(true)
        try {
            const res = await sendMessage(activeConversation._id, newMessage.trim())
            if (res.success) {
                setMessages(prev => [...prev, res.response])
                setNewMessage('')
                // Update conversation list
                setConversations(prev => prev.map(c =>
                    c._id === activeConversation._id
                        ? { ...c, lastMessage: { text: newMessage.trim(), senderId: user as any, sentAt: new Date().toISOString() } }
                        : c
                ))
            }
        } catch (err) {
            console.error('Failed to send message:', err)
        } finally { setSending(false) }
    }

    const selectConversation = (conv: Conversation) => {
        setActiveConversation(conv)
        setShowMobileChat(true)
    }

    const filteredConversations = conversations.filter(c => {
        const projectName = typeof c.projectId === 'object' ? c.projectId?.name : ''
        return projectName?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const formatTime = (date: string) => {
        const d = new Date(date)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

    const isOwnMessage = (msg: ChatMessage) => {
        const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId
        return senderId === user?._id
    }

    return (
        <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Chat</h1>
                    <p className="text-muted-foreground text-sm">Project group conversations</p>
                </div>
            </div>

            <div className="flex-1 flex border border-border rounded-sm overflow-hidden min-h-0">
                {/* Conversation List */}
                <div className={`w-full lg:w-80 xl:w-96 border-r border-border flex flex-col bg-card ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p>No conversations yet</p>
                                <p className="text-xs mt-1">Open a project to start chatting</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const projectName = typeof conv.projectId === 'object' ? conv.projectId?.name : 'Project'
                                const isActive = activeConversation?._id === conv._id
                                const participantCount = conv.participants?.filter(p => p.isActive).length || 0

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Hash className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-foreground truncate">{projectName}</p>
                                                    {conv.lastMessage?.sentAt && (
                                                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                                            {formatTime(conv.lastMessage.sentAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {conv.lastMessage?.text || 'No messages yet'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <Users className="w-3 h-3" />
                                                    <span>{participantCount} members</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-background ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card flex-shrink-0">
                                <button onClick={() => setShowMobileChat(false)} className="lg:hidden p-1 rounded-sm hover:bg-muted">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-8 h-8 rounded-sm bg-primary/20 flex items-center justify-center">
                                    <Hash className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {typeof activeConversation.projectId === 'object' ? activeConversation.projectId?.name : 'Project Chat'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {activeConversation.participants?.filter(p => p.isActive).length || 0} members
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No messages yet</p>
                                        <p className="text-xs mt-1">Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const own = isOwnMessage(msg)
                                        const sender = typeof msg.senderId === 'object' ? msg.senderId : null
                                        const showAvatar = !own && (idx === 0 || (() => {
                                            const prevSender = typeof messages[idx - 1]?.senderId === 'object' ? messages[idx - 1].senderId : null
                                            return (prevSender as any)?._id !== (sender as any)?._id
                                        })())

                                        return (
                                            <div key={msg._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-2 max-w-[75%] ${own ? 'flex-row-reverse' : ''}`}>
                                                    {!own && (
                                                        <div className="flex-shrink-0 mt-auto">
                                                            {showAvatar ? (
                                                                <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center">
                                                                    {sender?.avatar ? (
                                                                        <img src={sender.avatar} className="w-full h-full object-cover rounded-sm" />
                                                                    ) : (
                                                                        <span className="text-xs font-medium">{getInitials(sender?.name || '')}</span>
                                                                    )}
                                                                </div>
                                                            ) : <div className="w-7" />}
                                                        </div>
                                                    )}
                                                    <div>
                                                        {showAvatar && !own && (
                                                            <p className="text-xs text-muted-foreground mb-1 ml-1">
                                                                {sender?.name}
                                                                <span className="ml-1 text-primary/60 capitalize">({sender?.role})</span>
                                                            </p>
                                                        )}
                                                        <div className={`px-3 py-2 rounded-sm text-sm ${own
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-card border border-border text-foreground'
                                                            }`}>
                                                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                            <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : ''}`}>
                                                                <span className={`text-[10px] ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {msg.isEdited && (
                                                                    <span className={`text-[10px] ${own ? 'text-primary-foreground/50' : 'text-muted-foreground/60'}`}>
                                                                        (edited)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || sending}
                                        className="p-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm mt-1">Choose a project chat from the sidebar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
