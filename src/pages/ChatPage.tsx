import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    MessageCircle, Send, Loader2, ArrowLeft, Users, Search, Hash,
    Paperclip, X, FileText, Image as ImageIcon, File, Check, CheckCheck,
    Edit2, Trash2, Copy, ChevronRight, AlertTriangle, ChevronDown, ChevronUp, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ChatMilestonePanel } from '../components/ChatMilestonePanel'
import { ErrorModal } from '../components/ErrorModal'
import {
    getConversations, getConversationMessages, sendMessage, getUnreadCount, markConversationRead,
    createProjectConversation, uploadChatFile, editMessage, deleteMessage,
    getMilestones, createRazorpayOrder, verifyRazorpayPayment,
    type Conversation, type ChatMessage, type Milestone
} from '../lib/api'
import {
    connectSocket, disconnectSocket, joinConversation, leaveConversation,
    emitTypingStart, emitTypingStop, emitMessagesRead
} from '../lib/socket'

interface ContextMenu {
    x: number
    y: number
    message: ChatMessage
}

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
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
    const [isDragging, setIsDragging] = useState(false)
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
    const [editText, setEditText] = useState('')
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
    const [showMilestonePanel, setShowMilestonePanel] = useState(false)
    const [pendingPaymentMilestones, setPendingPaymentMilestones] = useState<Milestone[]>([])
    const [allMilestones, setAllMilestones] = useState<Milestone[]>([])
    const [paymentBannerExpanded, setPaymentBannerExpanded] = useState(false)
    const [payingMilestoneId, setPayingMilestoneId] = useState<string | null>(null)
    const [errorModal, setErrorModal] = useState<{ title?: string; message: string } | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const chatAreaRef = useRef<HTMLDivElement>(null)
    const editInputRef = useRef<HTMLInputElement>(null)
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const activeConvRef = useRef<string | null>(null)

    // Connect Socket.io on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            const socket = connectSocket(token)

            // Listen for real-time events
            socket.on('message:new', ({ conversationId, message: msg }) => {
                if (activeConvRef.current === conversationId) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === msg._id)) return prev
                        return [...prev, msg]
                    })
                }
                setConversations(prev => prev.map(c => {
                    if (c._id === conversationId) {
                        return {
                            ...c,
                            lastMessage: {
                                text: msg.message || '📎 Attachment',
                                senderId: msg.senderId,
                                sentAt: msg.createdAt,
                            }
                        }
                    }
                    return c
                }))
                // Update unread if not active conversation
                if (activeConvRef.current !== conversationId) {
                    setUnreadMap(prev => ({
                        ...prev,
                        [conversationId]: (prev[conversationId] || 0) + 1
                    }))
                }
            })

            socket.on('message:edited', ({ conversationId, message: msg }) => {
                if (activeConvRef.current === conversationId) {
                    setMessages(prev => prev.map(m => m._id === msg._id ? msg : m))
                }
            })

            socket.on('message:deleted', ({ conversationId, messageId }) => {
                if (activeConvRef.current === conversationId) {
                    setMessages(prev => prev.filter(m => m._id !== messageId))
                }
            })

            socket.on('messages:read', ({ conversationId, userId: readerId }) => {
                if (activeConvRef.current === conversationId && readerId !== user?._id) {
                    setMessages(prev => prev.map(m => {
                        const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId
                        if (senderId === user?._id) {
                            const alreadySeen = m.seenBy?.some(s => {
                                const sId = typeof s.userId === 'object' ? (s.userId as any)._id : s.userId
                                return sId === readerId
                            })
                            if (!alreadySeen) {
                                return {
                                    ...m,
                                    seenBy: [...(m.seenBy || []), { userId: readerId, seenAt: new Date().toISOString() }]
                                }
                            }
                        }
                        return m
                    }))
                }
            })

            socket.on('typing:start', ({ conversationId, userId: typerId, userName }) => {
                if (activeConvRef.current === conversationId && typerId !== user?._id) {
                    setTypingUsers(prev => ({ ...prev, [typerId]: userName }))
                }
            })

            socket.on('typing:stop', ({ conversationId, userId: typerId }) => {
                if (activeConvRef.current === conversationId) {
                    setTypingUsers(prev => {
                        const next = { ...prev }
                        delete next[typerId]
                        return next
                    })
                }
            })

            socket.on('user:online', ({ userId: uid }) => {
                setOnlineUserIds(prev => new Set([...prev, uid]))
            })

            socket.on('user:offline', ({ userId: uid }) => {
                setOnlineUserIds(prev => {
                    const next = new Set(prev)
                    next.delete(uid)
                    return next
                })
            })
        }

        fetchConversations()
        fetchUnread()

        return () => {
            disconnectSocket()
        }
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

    // Join/leave conversation rooms
    useEffect(() => {
        if (activeConversation) {
            const convId = activeConversation._id
            activeConvRef.current = convId
            joinConversation(convId)
            fetchMessages(convId)
            handleMarkRead(convId)
            emitMessagesRead(convId)
        }
        return () => {
            if (activeConvRef.current) {
                leaveConversation(activeConvRef.current)
                activeConvRef.current = null
            }
            setTypingUsers({})
        }
    }, [activeConversation?._id])

    // Fetch pending payment milestones for the active conversation
    const fetchPendingPayments = useCallback(async () => {
        if (!activeConversation) { setPendingPaymentMilestones([]); setAllMilestones([]); return }
        const pid = typeof activeConversation.projectId === 'object' ? activeConversation.projectId._id : activeConversation.projectId
        if (!pid) return
        try {
            const res = await getMilestones(pid)
            if (res.success) {
                setAllMilestones(res.response)
                setPendingPaymentMilestones(res.response.filter((m: Milestone) => m.status === 'completed'))
            }
        } catch { }
    }, [activeConversation?._id])

    useEffect(() => { fetchPendingPayments() }, [fetchPendingPayments])

    // Join all conversation rooms for sidebar updates
    useEffect(() => {
        conversations.forEach(c => joinConversation(c._id))
    }, [conversations])

    useEffect(() => { scrollToBottom() }, [messages])

    useEffect(() => {
        if (editingMessage && editInputRef.current) editInputRef.current.focus()
    }, [editingMessage])

    useEffect(() => {
        const handler = () => setContextMenu(null)
        if (contextMenu) window.addEventListener('click', handler)
        return () => window.removeEventListener('click', handler)
    }, [contextMenu])

    // Typing with Socket.io
    const handleTyping = useCallback(() => {
        if (!activeConversation) return
        emitTypingStart(activeConversation._id)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            if (activeConversation) emitTypingStop(activeConversation._id)
        }, 2000)
    }, [activeConversation?._id])

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

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
            emitMessagesRead(convId)
        } catch { }
    }

    const fetchConversations = async () => {
        try {
            const res = await getConversations()
            if (res.success) setConversations(res.response)
        } catch (err) { console.error('Failed to fetch conversations:', err) }
        finally { setLoading(false) }
    }

    const fetchMessages = async (conversationId: string, silent = false) => {
        if (!silent) setMessagesLoading(true)
        try {
            const res = await getConversationMessages(conversationId)
            if (res.success) setMessages(res.response.messages)
        } catch (err) { console.error('Failed to fetch messages:', err) }
        finally { if (!silent) setMessagesLoading(false) }
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return
        const validFiles: File[] = []
        for (let i = 0; i < files.length; i++) {
            if (files[i].size <= 10 * 1024 * 1024) validFiles.push(files[i])
        }
        setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 5))
    }

    const removeAttachedFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === chatAreaRef.current) setIsDragging(false) }
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFileSelect(e.dataTransfer.files) }

    const extractErrorMessage = (err: unknown): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as any
            return axiosErr.response?.data?.message || axiosErr.response?.statusText || 'Something went wrong'
        }
        if (err instanceof Error) return err.message
        return 'An unexpected error occurred'
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!newMessage.trim() && attachedFiles.length === 0) || !activeConversation || sending) return
        setSending(true)

        // Stop typing indicator
        if (activeConversation) emitTypingStop(activeConversation._id)

        try {
            let uploadedAttachments: { name: string; url: string; type: string; size: number }[] = []
            if (attachedFiles.length > 0) {
                const results = await Promise.all(attachedFiles.map(async (file) => {
                    try {
                        return await uploadChatFile(file)
                    } catch (err) {
                        setErrorModal({ title: 'Upload Failed', message: `Failed to upload "${file.name}": ${extractErrorMessage(err)}` })
                        return null
                    }
                }))
                uploadedAttachments = results
                    .filter((r): r is NonNullable<typeof r> => r !== null && r.success)
                    .map(r => ({ name: r.response.name, url: r.response.url, type: r.response.type, size: r.response.size }))

                if (uploadedAttachments.length === 0 && attachedFiles.length > 0) {
                    setSending(false)
                    return
                }
            }
            const msgType = uploadedAttachments.length > 0 && !newMessage.trim()
                ? (uploadedAttachments[0].type.startsWith('image/') ? 'image' : 'file') : 'text'
            const res = await sendMessage(activeConversation._id, newMessage.trim(), msgType, uploadedAttachments)
            if (res.success) {
                setMessages(prev => {
                    if (prev.some(m => m._id === res.response._id)) return prev
                    return [...prev, res.response]
                })
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
            setErrorModal({ title: 'Send Failed', message: extractErrorMessage(err) })
        }
        finally { setSending(false) }
    }

    const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, message: msg })
    }

    const handleTouchStart = (msg: ChatMessage) => {
        longPressTimerRef.current = setTimeout(() => {
            setContextMenu({ x: window.innerWidth / 2 - 80, y: window.innerHeight / 2, message: msg })
        }, 500)
    }

    const handleTouchEnd = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }

    const handleEditStart = (msg: ChatMessage) => {
        setEditingMessage(msg)
        setEditText(msg.message)
        setContextMenu(null)
    }

    const handleEditSave = async () => {
        if (!editingMessage || !editText.trim()) return
        try {
            const res = await editMessage(editingMessage._id, editText.trim())
            if (res.success) {
                setMessages(prev => prev.map(m => m._id === editingMessage._id ? { ...m, message: editText.trim(), isEdited: true } : m))
            }
        } catch (err) { setErrorModal({ title: 'Edit Failed', message: extractErrorMessage(err) }) }
        setEditingMessage(null)
        setEditText('')
    }

    const handleDeleteMessage = async (msg: ChatMessage) => {
        setContextMenu(null)
        try {
            const res = await deleteMessage(msg._id)
            if (res.success) {
                setMessages(prev => prev.filter(m => m._id !== msg._id))
            }
        } catch (err) { setErrorModal({ title: 'Delete Failed', message: extractErrorMessage(err) }) }
    }

    const handleCopyMessage = (msg: ChatMessage) => {
        navigator.clipboard.writeText(msg.message).catch(() => { })
        setContextMenu(null)
    }

    const handleBannerRazorpayPayment = async (milestone: Milestone) => {
        setPayingMilestoneId(milestone._id)
        try {
            const res = await createRazorpayOrder(milestone._id)
            if (!res.success) {
                setErrorModal({ title: 'Payment Error', message: 'Failed to create payment order' })
                return
            }
            const { orderId, amount, currency, keyId } = res.response
            const options = {
                key: keyId, amount, currency,
                name: 'AgencyFlow',
                description: `Payment for: ${milestone.title}`,
                order_id: orderId,
                handler: async (response: any) => {
                    try {
                        await verifyRazorpayPayment(milestone._id, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        })
                        fetchPendingPayments()
                    } catch (err) {
                        setErrorModal({ title: 'Payment Verification Failed', message: extractErrorMessage(err) })
                    }
                },
                prefill: { name: user?.name || '', email: user?.email || '' },
                theme: { color: '#6366f1' },
            }
            const rzp = new (window as any).Razorpay(options)
            rzp.open()
        } catch (err) {
            setErrorModal({ title: 'Payment Error', message: extractErrorMessage(err) })
        }
        finally { setPayingMilestoneId(null) }
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
        if (seenByOthers.length >= otherParticipants.length) return 'read' as const
        if (seenByOthers.length > 0) return 'delivered' as const
        return 'sent' as const
    }

    const typingUserNames = Object.values(typingUsers)

    return (
        <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
            <div className="flex-1 flex border border-border rounded-sm overflow-hidden min-h-0">
                {/* Conversation List */}
                <div className={`w-full lg:w-80 xl:w-96 border-r border-border flex flex-col bg-card ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
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
                                    <button key={conv._id} onClick={() => selectConversation(conv)}
                                        className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'}`}>
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
                                                <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                    {conv.lastMessage?.text || 'No messages yet'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <Users className="w-3 h-3" /><span>{participantCount} members</span>
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
                <div ref={chatAreaRef}
                    className={`flex-1 flex flex-col bg-background relative ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>

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
                            <div className="h-14 px-4 flex items-center gap-3 border-b border-border bg-card flex-shrink-0 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setShowMilestonePanel(true)}>
                                <button onClick={(e) => { e.stopPropagation(); setShowMobileChat(false) }} className="lg:hidden p-1 rounded-sm hover:bg-muted">
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
                                        {(() => {
                                            const onlineCount = activeConversation.participants?.filter(p => {
                                                const pId = typeof p.userId === 'object' ? (p.userId as any)._id : p.userId
                                                return p.isActive && onlineUserIds.has(pId)
                                            }).length || 0
                                            return onlineCount > 0 ? ` • ${onlineCount} online` : ''
                                        })()}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </div>

                            {/* Milestone Progress Bar */}
                            {allMilestones.length > 0 && (
                                <div className="px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                        <span className="font-medium">Project Progress</span>
                                        <span>
                                            {allMilestones.filter(m => m.status === 'paid').length}/{allMilestones.length} milestones
                                            {' · '}
                                            {allMilestones.length > 0 ? Math.round((allMilestones.filter(m => m.status === 'paid').length / allMilestones.length) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                        {allMilestones.map((m, i) => {
                                            const widthPct = 100 / allMilestones.length
                                            let colorClass = 'bg-muted-foreground/20' // pending
                                            if (m.status === 'paid') colorClass = 'bg-emerald-500'
                                            else if (m.status === 'completed') colorClass = 'bg-primary'
                                            else if (m.status === 'in_progress') colorClass = 'bg-primary/50'
                                            return (
                                                <div
                                                    key={m._id}
                                                    className={`h-full ${colorClass} ${i > 0 ? 'border-l border-background' : ''}`}
                                                    style={{ width: `${widthPct}%` }}
                                                    title={`${m.title}: ${m.status.replace('_', ' ')}`}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Payment Warning Banner */}
                            {pendingPaymentMilestones.length > 0 && (
                                <div className="border-b border-destructive/30 bg-destructive/10 flex-shrink-0">
                                    <button
                                        onClick={() => setPaymentBannerExpanded(!paymentBannerExpanded)}
                                        className="w-full px-4 py-2.5 flex items-center gap-2 text-left"
                                    >
                                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                        <span className="text-sm font-medium text-destructive flex-1">
                                            {pendingPaymentMilestones.length} payment{pendingPaymentMilestones.length > 1 ? 's' : ''} pending
                                            — ₹{pendingPaymentMilestones.reduce((s, m) => s + m.amount, 0).toLocaleString('en-IN')}
                                        </span>
                                        {paymentBannerExpanded
                                            ? <ChevronUp className="w-4 h-4 text-destructive" />
                                            : <ChevronDown className="w-4 h-4 text-destructive" />
                                        }
                                    </button>
                                    {paymentBannerExpanded && (
                                        <div className="px-4 pb-3 space-y-2">
                                            {pendingPaymentMilestones.map(m => (
                                                <div key={m._id} className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-sm">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ₹{m.amount.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                    {user?.role === 'client' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleBannerRazorpayPayment(m) }}
                                                            disabled={payingMilestoneId === m._id}
                                                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            {payingMilestoneId === m._id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                            Pay Now
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
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
                                            <div key={msg._id} className={`flex ${own ? 'justify-end' : 'justify-start'} group`}
                                                onContextMenu={(e) => handleContextMenu(e, msg)}
                                                onTouchStart={() => handleTouchStart(msg)}
                                                onTouchEnd={handleTouchEnd}
                                                onTouchMove={handleTouchEnd}>
                                                <div className={`flex gap-2 max-w-[75%] ${own ? 'flex-row-reverse' : ''}`}>
                                                    {!own && (
                                                        <div className="flex-shrink-0 mt-auto">
                                                            {showAvatar ? (
                                                                <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center">
                                                                    {sender?.avatar ? (
                                                                        <img src={sender.avatar} className="w-full h-full object-cover rounded-sm" alt="" />
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
                                                        {editingMessage?._id === msg._id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input ref={editInputRef} value={editText} onChange={e => setEditText(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') { setEditingMessage(null); setEditText('') } }}
                                                                    className="px-3 py-2 bg-muted border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]" />
                                                                <button onClick={handleEditSave} className="p-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => { setEditingMessage(null); setEditText('') }} className="p-1.5 bg-muted rounded-sm hover:bg-muted/80"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <div className={`px-3 py-2 rounded-sm text-sm ${own ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <div className="space-y-2 mb-1">
                                                                        {msg.attachments.map((att, attIdx) => (
                                                                            att.type?.startsWith('image/') ? (
                                                                                <div key={attIdx} className="relative group/img">
                                                                                    <img
                                                                                        src={att.url}
                                                                                        alt={att.name}
                                                                                        className="max-w-[280px] max-h-[240px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                        loading="lazy"
                                                                                        onClick={() => window.open(att.url, '_blank')}
                                                                                    />
                                                                                    <a
                                                                                        href={att.url}
                                                                                        download={att.name}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity ${own ? 'bg-black/40 text-white hover:bg-black/60' : 'bg-black/40 text-white hover:bg-black/60'}`}
                                                                                        onClick={e => e.stopPropagation()}
                                                                                    >
                                                                                        <Download className="w-3.5 h-3.5" />
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <a key={attIdx} href={att.url} download={att.name} target="_blank" rel="noopener noreferrer"
                                                                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${own ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-muted/50 hover:bg-muted'}`}>
                                                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${own ? 'bg-primary-foreground/15' : 'bg-primary/10'}`}>
                                                                                        {getFileIcon(att.type)}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-xs font-medium truncate">{att.name}</p>
                                                                                        <p className={`text-[10px] ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatFileSize(att.size)}</p>
                                                                                    </div>
                                                                                    <Download className={`w-4 h-4 flex-shrink-0 ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`} />
                                                                                </a>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                                                                <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : ''}`}>
                                                                    <span className={`text-[10px] ${own ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {msg.isEdited && (
                                                                        <span className={`text-[10px] ${own ? 'text-primary-foreground/50' : 'text-muted-foreground/60'}`}>(edited)</span>
                                                                    )}
                                                                    {status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                                                                    {status === 'delivered' && <CheckCheck className={`w-3.5 h-3.5 ${own ? 'text-primary-foreground/50' : 'text-muted-foreground'}`} />}
                                                                    {status === 'sent' && <Check className={`w-3.5 h-3.5 ${own ? 'text-primary-foreground/50' : 'text-muted-foreground'}`} />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}

                                {typingUserNames.length > 0 && (
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="flex items-center gap-1 bg-card border border-border rounded-sm px-3 py-2">
                                            <div className="flex gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-1">
                                                {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {attachedFiles.length > 0 && (
                                <div className="px-3 pt-2 border-t border-border bg-card">
                                    <div className="flex flex-wrap gap-2">
                                        {attachedFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-muted/50 border border-input rounded-sm px-2 py-1.5 text-sm">
                                                {getFileIcon(file.type)}
                                                <span className="truncate max-w-[120px] text-xs">{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                                                <button onClick={() => removeAttachedFile(idx)} className="p-0.5 hover:bg-destructive/20 rounded-sm"><X className="w-3 h-3 text-destructive" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} onChange={e => handleFileSelect(e.target.files)} className="hidden" multiple
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm transition-colors" title="Attach files">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" disabled={sending} />
                                    <button type="submit" disabled={(!newMessage.trim() && attachedFiles.length === 0) || sending}
                                        className="p-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
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

            {/* Milestone Panel */}
            {activeConversation && (
                <ChatMilestonePanel
                    conversation={activeConversation}
                    open={showMilestonePanel}
                    onClose={() => setShowMilestonePanel(false)}
                    onPaymentUpdate={fetchPendingPayments}
                />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div className="fixed z-[100] bg-card border border-border rounded-sm shadow-lg py-1 min-w-[160px] animate-fade-in"
                    style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleCopyMessage(contextMenu.message)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <Copy className="w-4 h-4" /> Copy
                    </button>
                    {isOwnMessage(contextMenu.message) && (
                        <>
                            <button onClick={() => handleEditStart(contextMenu.message)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDeleteMessage(contextMenu.message)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Error Modal */}
            <ErrorModal
                open={!!errorModal}
                title={errorModal?.title}
                message={errorModal?.message || ''}
                onClose={() => setErrorModal(null)}
            />
        </div>
    )
}
