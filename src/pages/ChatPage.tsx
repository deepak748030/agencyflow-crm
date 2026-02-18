import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    MessageCircle, Send, Loader2, ArrowLeft, Users, Search, Hash,
    Paperclip, X, FileText, Image as ImageIcon, File, Check, CheckCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
    getConversations, getConversationMessages, sendMessage, getUnreadCount, markConversationRead,
    createProjectConversation, uploadChatFile,
    type Conversation, type ChatMessage
} from '../lib/api'

export function ChatPage() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileChat, setShowMobileChat] = useState(false)
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchConversations()
        fetchUnread()
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [])

    // Auto-open project conversation from query param
    useEffect(() => {
        const projectId = searchParams.get('projectId')
        if (projectId && conversations.length > 0) {
            const existing = conversations.find(c => {
                const pid = typeof c.projectId === 'object' ? c.projectId._id : c.projectId
                return pid === projectId
            })
            if (existing) {
                selectConversation(existing)
            } else {
                createProjectConversation(projectId).then(res => {
                    if (res.success) {
                        setConversations(prev => [res.response, ...prev])
                        selectConversation(res.response)
                    }
                }).catch(() => { })
            }
        }
    }, [conversations.length, searchParams])

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation._id)
            handleMarkRead(activeConversation._id)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = setInterval(() => {
                fetchMessages(activeConversation._id, true)
                fetchUnread()
            }, 3000)
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [activeConversation?._id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Typing indicator simulation - clear after 3s of no typing
    const handleTyping = useCallback(() => {
        // In a real app this would emit via Socket.io
        // For now we simulate with local state
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers([])
        }, 3000)
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchUnread = async () => {
        try {
            const res = await getUnreadCount()
            if (res.success) setUnreadMap(res.response.perConversation)
        } catch { }
    }

    const handleMarkRead = async (convId: string) => {
        try {
            await markConversationRead(convId)
            setUnreadMap(prev => { const n = { ...prev }; delete n[convId]; return n })
        } catch { }
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

    // File handling
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return
        const validFiles: File[] = []
        for (let i = 0; i < files.length; i++) {
            if (files[i].size <= 10 * 1024 * 1024) { // 10MB limit
                validFiles.push(files[i])
            }
        }
        setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
    }

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    }

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.currentTarget === chatAreaRef.current) {
            setIsDragging(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!newMessage.trim() && attachedFiles.length === 0) || !activeConversation || sending) return
        setSending(true)
        setUploadingFiles(attachedFiles.length > 0)

        try {
            // Upload files first
            let uploadedAttachments: { name: string; url: string; type: string; size: number }[] = []
            if (attachedFiles.length > 0) {
                const uploadPromises = attachedFiles.map(file => uploadChatFile(file))
                const results = await Promise.all(uploadPromises)
                uploadedAttachments = results
                    .filter(r => r.success)
                    .map(r => ({ name: r.response.name, url: r.response.url, type: r.response.type, size: r.response.size }))
            }

            const msgType = uploadedAttachments.length > 0 && !newMessage.trim()
                ? (uploadedAttachments[0].type.startsWith('image/') ? 'image' : 'file')
                : 'text'

            const res = await sendMessage(activeConversation._id, newMessage.trim(), msgType, uploadedAttachments)
            if (res.success) {
                setMessages(prev => [...prev, res.response])
                setNewMessage('')
                setAttachedFiles([])
                const lastText = newMessage.trim() || `📎 ${uploadedAttachments.length} file(s)`
                setConversations(prev => prev.map(c =>
                    c._id === activeConversation._id
                        ? { ...c, lastMessage: { text: lastText, senderId: user as any, sentAt: new Date().toISOString() } }
                        : c
                ))
            }
        } catch (err) {
            console.error('Failed to send message:', err)
        } finally {
            setSending(false)
            setUploadingFiles(false)
        }
    }

    const selectConversation = (conv: Conversation) => {
        setActiveConversation(conv)
        setShowMobileChat(true)
        handleMarkRead(conv._id)
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

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
        if (type.includes('pdf')) return <FileText className="w-4 h-4" />
        return <File className="w-4 h-4" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // Get read status for a message (WhatsApp-style)
    // sent = single grey check, delivered = double grey check, read = double blue check
    const getMessageStatus = (msg: ChatMessage) => {
        if (!isOwnMessage(msg)) return null
        const otherParticipants = activeConversation?.participants?.filter(p => {
            const pId = typeof p.userId === 'object' ? (p.userId as any)._id : p.userId
            return pId !== user?._id && p.isActive
        }) || []
        if (otherParticipants.length === 0) return 'sent' as const
        const seenByOthers = msg.seenBy?.filter(s => {
            const sId = typeof s.userId === 'object' ? (s.userId as any)._id || s.userId : s.userId
            return sId !== user?._id
        }) || []
        if (seenByOthers.length >= otherParticipants.length) {
            return 'read' as const
        }
        if (seenByOthers.length > 0) {
            return 'delivered' as const
        }
        return 'sent' as const
    }

    return (
        <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
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
                                const unreadCount = unreadMap[conv._id] || 0


                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
                                                <Hash className="w-5 h-5 text-primary" />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{projectName}</p>
                                                    {conv.lastMessage?.sentAt && (
                                                        <span className={`text-xs ml-2 flex-shrink-0 ${unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                                            {formatTime(conv.lastMessage.sentAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                        {conv.lastMessage?.text || 'No messages yet'}
                                                    </p>
                                                </div>
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
                <div
                    ref={chatAreaRef}
                    className={`flex-1 flex flex-col bg-background relative ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* Drag overlay */}
                    {isDragging && activeConversation && (
                        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-sm flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                                <Paperclip className="w-12 h-12 text-primary mx-auto mb-2" />
                                <p className="text-primary font-semibold">Drop files here to attach</p>
                                <p className="text-muted-foreground text-sm mt-1">Max 10MB per file • Up to 5 files</p>
                            </div>
                        </div>
                    )}

                    {activeConversation ? (
                        <>
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
                                        const status = getMessageStatus(msg)

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
                                                            {/* Attachments */}
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="space-y-2 mb-1">
                                                                    {msg.attachments.map((att, attIdx) => (
                                                                        att.type?.startsWith('image/') ? (
                                                                            <a key={attIdx} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                                                                <img
                                                                                    src={att.url}
                                                                                    alt={att.name}
                                                                                    className="max-w-[240px] max-h-[200px] rounded-sm object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                />
                                                                            </a>
                                                                        ) : (
                                                                            <a
                                                                                key={attIdx}
                                                                                href={att.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`flex items-center gap-2 p-2 rounded-sm transition-colors ${own
                                                                                    ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                                                                    : 'bg-muted/50 hover:bg-muted'
                                                                                    }`}
                                                                            >
                                                                                {getFileIcon(att.type)}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-medium truncate">{att.name}</p>
                                                                                    <p className={`text-[10px] ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                                                                        {formatFileSize(att.size)}
                                                                                    </p>
                                                                                </div>
                                                                            </a>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {msg.message && (
                                                                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                                            )}
                                                            <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : ''}`}>
                                                                <span className={`text-[10px] ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {msg.isEdited && (
                                                                    <span className={`text-[10px] ${own ? 'text-primary-foreground/50' : 'text-muted-foreground/60'}`}>
                                                                        (edited)
                                                                    </span>
                                                                )}
                                                                {/* WhatsApp-style check marks */}
                                                                {status === 'read' && (
                                                                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                                                )}
                                                                {status === 'delivered' && (
                                                                    <CheckCheck className={`w-3.5 h-3.5 ${own ? 'text-primary-foreground/50' : 'text-muted-foreground'}`} />
                                                                )}
                                                                {status === 'sent' && (
                                                                    <Check className={`w-3.5 h-3.5 ${own ? 'text-primary-foreground/50' : 'text-muted-foreground'}`} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}

                                {/* Typing indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="flex items-center gap-1 bg-card border border-border rounded-sm px-3 py-2">
                                            <div className="flex gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                {typingUsers.join(', ')} typing...
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Attached files preview */}
                            {attachedFiles.length > 0 && (
                                <div className="px-3 pt-2 border-t border-border bg-card">
                                    <div className="flex flex-wrap gap-2">
                                        {attachedFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-muted/50 border border-input rounded-sm px-2 py-1.5 text-sm">
                                                {getFileIcon(file.type)}
                                                <span className="truncate max-w-[120px] text-xs">{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                                                <button
                                                    onClick={() => removeAttachedFile(idx)}
                                                    className="p-0.5 hover:bg-destructive/20 rounded-sm transition-colors"
                                                >
                                                    <X className="w-3 h-3 text-destructive" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={e => handleFileSelect(e.target.files)}
                                        className="hidden"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm transition-colors"
                                        title="Attach files"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        value={newMessage}
                                        onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={(!newMessage.trim() && attachedFiles.length === 0) || sending}
                                        className="p-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {uploadingFiles ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
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
