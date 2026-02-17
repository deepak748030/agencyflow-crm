import { useState, useEffect, useRef } from 'react'
import { Save, RefreshCw, Plus, Trash2, FileText, Upload, ImageIcon, X } from 'lucide-react'
import { cn } from '../lib/utils'
import api from '../lib/api'

interface HomeContentData {
    _id?: string
    title_hi: string
    title_en: string
    subtitle_hi: string
    subtitle_en: string
    paragraphs_hi: string[]
    paragraphs_en: string[]
    bannerImages: string[]
    sidebarImage: string
    updatedAt?: string
}

const EMPTY: HomeContentData = {
    title_hi: '',
    title_en: '',
    subtitle_hi: '',
    subtitle_en: '',
    paragraphs_hi: [''],
    paragraphs_en: [''],
    bannerImages: [],
    sidebarImage: '',
}

export function HomeContentPage() {
    const [content, setContent] = useState<HomeContentData>(EMPTY)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingSidebar, setIsUploadingSidebar] = useState(false)
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const sidebarFileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchContent()
    }, [])

    const fetchContent = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/home-content')
            if (res.data.success && res.data.response) {
                const d = res.data.response
                setContent({
                    _id: d._id,
                    title_hi: d.title_hi || '',
                    title_en: d.title_en || '',
                    subtitle_hi: d.subtitle_hi || '',
                    subtitle_en: d.subtitle_en || '',
                    paragraphs_hi: d.paragraphs_hi?.length ? d.paragraphs_hi : [''],
                    paragraphs_en: d.paragraphs_en?.length ? d.paragraphs_en : [''],
                    bannerImages: d.bannerImages || [],
                    sidebarImage: d.sidebarImage || '',
                    updatedAt: d.updatedAt,
                })
            }
        } catch {
            // No content yet — keep empty
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)
        try {
            const payload = {
                title_hi: content.title_hi.trim(),
                title_en: content.title_en.trim(),
                subtitle_hi: content.subtitle_hi.trim(),
                subtitle_en: content.subtitle_en.trim(),
                paragraphs_hi: content.paragraphs_hi.filter(p => p.trim()),
                paragraphs_en: content.paragraphs_en.filter(p => p.trim()),
            }
            const res = await api.post('/home-content', payload)
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Home content saved successfully!' })
                if (res.data.response?._id) {
                    setContent(prev => ({ ...prev, _id: res.data.response._id }))
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploading(true)
        setMessage(null)
        try {
            const formData = new FormData()
            formData.append('image', file)
            const res = await api.post('/home-content/banner/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data.success) {
                setContent(prev => ({ ...prev, bannerImages: res.data.response.bannerImages }))
                setMessage({ type: 'success', text: 'Banner image uploaded!' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload banner' })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleBannerDelete = async (imageUrl: string) => {
        if (!confirm('Delete this banner image?')) return
        setDeletingUrl(imageUrl)
        setMessage(null)
        try {
            const res = await api.delete('/home-content/banner', { data: { imageUrl } })
            if (res.data.success) {
                setContent(prev => ({ ...prev, bannerImages: res.data.response.bannerImages }))
                setMessage({ type: 'success', text: 'Banner image deleted!' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete banner' })
        } finally {
            setDeletingUrl(null)
        }
    }

    const handleSidebarImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploadingSidebar(true)
        setMessage(null)
        try {
            const formData = new FormData()
            formData.append('image', file)
            const res = await api.post('/home-content/sidebar-image/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data.success) {
                setContent(prev => ({ ...prev, sidebarImage: res.data.response.sidebarImage }))
                setMessage({ type: 'success', text: 'Sidebar image uploaded!' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload sidebar image' })
        } finally {
            setIsUploadingSidebar(false)
            if (sidebarFileInputRef.current) sidebarFileInputRef.current.value = ''
        }
    }

    const handleSidebarImageDelete = async () => {
        if (!confirm('Delete sidebar image?')) return
        setMessage(null)
        try {
            const res = await api.delete('/home-content/sidebar-image')
            if (res.data.success) {
                setContent(prev => ({ ...prev, sidebarImage: '' }))
                setMessage({ type: 'success', text: 'Sidebar image deleted!' })
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete sidebar image' })
        }
    }

    const addParagraph = (lang: 'hi' | 'en') => {
        const key = lang === 'hi' ? 'paragraphs_hi' : 'paragraphs_en'
        setContent(prev => ({ ...prev, [key]: [...prev[key], ''] }))
    }

    const removeParagraph = (lang: 'hi' | 'en', index: number) => {
        const key = lang === 'hi' ? 'paragraphs_hi' : 'paragraphs_en'
        setContent(prev => ({
            ...prev,
            [key]: prev[key].filter((_, i) => i !== index),
        }))
    }

    const updateParagraph = (lang: 'hi' | 'en', index: number, value: string) => {
        const key = lang === 'hi' ? 'paragraphs_hi' : 'paragraphs_en'
        setContent(prev => ({
            ...prev,
            [key]: prev[key].map((p, i) => (i === index ? value : p)),
        }))
    }

    if (isLoading) {
        return (
            <div className="animate-fade-in space-y-4">
                <div className="h-8 w-48 skeleton rounded" />
                <div className="h-64 skeleton rounded-xl" />
            </div>
        )
    }

    return (
        <div className="animate-fade-in space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Home Content
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage home screen banners and text in Hindi & English
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchContent}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                        Reload
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isSaving ? '' : 'Save'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={cn(
                    'p-3 rounded-lg text-sm border',
                    message.type === 'success'
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                )}>
                    {message.text}
                </div>
            )}

            {content.updatedAt && (
                <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(content.updatedAt).toLocaleString('en-IN')}
                </p>
            )}

            {/* Banner Images Section */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Banner Images (Slider)
                    </h2>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                            {isUploading ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isUploading ? 'Uploading...' : 'Upload Banner'}
                        </button>
                    </div>
                </div>

                {content.bannerImages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No banner images uploaded yet.</p>
                        <p className="text-xs mt-1">Upload images that will appear in the home screen slider.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {content.bannerImages.map((url, i) => (
                            <div key={url} className="relative group rounded-lg overflow-hidden border border-border">
                                <img
                                    src={url}
                                    alt={`Banner ${i + 1}`}
                                    className="w-full h-32 object-cover"
                                />
                                <button
                                    onClick={() => handleBannerDelete(url)}
                                    disabled={deletingUrl === url}
                                    className="absolute top-1.5 right-1.5 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                >
                                    {deletingUrl === url ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-0.5 text-center">
                                    Banner {i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar Image Section */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Sidebar Drawer Image
                    </h2>
                    <div>
                        <input
                            ref={sidebarFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSidebarImageUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => sidebarFileInputRef.current?.click()}
                            disabled={isUploadingSidebar}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                            {isUploadingSidebar ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isUploadingSidebar ? 'Uploading...' : content.sidebarImage ? 'Change Image' : 'Upload Image'}
                        </button>
                    </div>
                </div>

                {content.sidebarImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-border inline-block">
                        <img
                            src={content.sidebarImage}
                            alt="Sidebar"
                            className="w-full max-w-xs h-48 object-cover"
                        />
                        <button
                            onClick={handleSidebarImageDelete}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No sidebar image uploaded yet.</p>
                        <p className="text-xs mt-1">This image appears at the top of the mobile app's sidebar drawer.</p>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">हि</span>
                    Hindi Content
                </h2>

                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (Hindi)</label>
                    <input
                        type="text"
                        value={content.title_hi}
                        onChange={(e) => setContent(prev => ({ ...prev, title_hi: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors"
                        placeholder="Hindi title..."
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtitle (Hindi)</label>
                    <input
                        type="text"
                        value={content.subtitle_hi}
                        onChange={(e) => setContent(prev => ({ ...prev, subtitle_hi: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors"
                        placeholder="Hindi subtitle..."
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paragraphs (Hindi)</label>
                        <button
                            onClick={() => addParagraph('hi')}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Paragraph
                        </button>
                    </div>
                    <div className="space-y-2">
                        {content.paragraphs_hi.map((p, i) => (
                            <div key={i} className="flex gap-2">
                                <textarea
                                    value={p}
                                    onChange={(e) => updateParagraph('hi', i, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors resize-y min-h-[60px]"
                                    placeholder={`Paragraph ${i + 1}...`}
                                    rows={3}
                                />
                                {content.paragraphs_hi.length > 1 && (
                                    <button
                                        onClick={() => removeParagraph('hi', i)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors self-start"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* English Section */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-accent/10 text-accent-foreground flex items-center justify-center text-xs font-bold">En</span>
                    English Content
                </h2>

                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title (English)</label>
                    <input
                        type="text"
                        value={content.title_en}
                        onChange={(e) => setContent(prev => ({ ...prev, title_en: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors"
                        placeholder="English title..."
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtitle (English)</label>
                    <input
                        type="text"
                        value={content.subtitle_en}
                        onChange={(e) => setContent(prev => ({ ...prev, subtitle_en: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors"
                        placeholder="English subtitle..."
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paragraphs (English)</label>
                        <button
                            onClick={() => addParagraph('en')}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Paragraph
                        </button>
                    </div>
                    <div className="space-y-2">
                        {content.paragraphs_en.map((p, i) => (
                            <div key={i} className="flex gap-2">
                                <textarea
                                    value={p}
                                    onChange={(e) => updateParagraph('en', i, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary transition-colors resize-y min-h-[60px]"
                                    placeholder={`Paragraph ${i + 1}...`}
                                    rows={3}
                                />
                                {content.paragraphs_en.length > 1 && (
                                    <button
                                        onClick={() => removeParagraph('en', i)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors self-start"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
