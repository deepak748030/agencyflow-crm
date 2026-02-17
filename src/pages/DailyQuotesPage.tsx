import { useState, useEffect, useRef } from 'react'
import {
    Plus, Trash2, Calendar, Image, Save, X,
    ChevronLeft, ChevronRight, Eye, EyeOff, RefreshCw, Upload, Edit2
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
    getDailyQuotes,
    createDailyQuote,
    updateDailyQuote,
    deleteDailyQuote,
    uploadDailyQuoteImage,
    DailyQuoteData
} from '../lib/api'

interface QuoteForm {
    imageUrl: string
    date: string
}

const emptyForm: QuoteForm = {
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
}

export function DailyQuotesPage() {
    const [quotes, setQuotes] = useState<DailyQuoteData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<QuoteForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { fetchQuotes() }, [page])

    const fetchQuotes = async () => {
        setIsLoading(true)
        try {
            const response = await getDailyQuotes(page)
            if (response.success) {
                setQuotes(response.response.quotes)
                setTotalPages(response.response.pagination.pages)
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to fetch' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setMessage(null)
        try {
            const response = await uploadDailyQuoteImage(file)
            if (response.success) {
                setForm(prev => ({ ...prev, imageUrl: response.response.imageUrl }))
                setMessage({ type: 'success', text: 'Image uploaded!' })
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.imageUrl) {
            setMessage({ type: 'error', text: 'Please upload an image first' })
            return
        }
        setSaving(true)
        setMessage(null)
        try {
            if (editingId) {
                await updateDailyQuote(editingId, { imageUrl: form.imageUrl, date: form.date })
                setMessage({ type: 'success', text: 'Updated successfully!' })
            } else {
                await createDailyQuote({ imageUrl: form.imageUrl, date: form.date })
                setMessage({ type: 'success', text: 'Created successfully!' })
            }
            setShowForm(false)
            setEditingId(null)
            setForm(emptyForm)
            fetchQuotes()
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save' })
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (quote: DailyQuoteData) => {
        setForm({
            imageUrl: quote.imageUrl || '',
            date: new Date(quote.date).toISOString().split('T')[0],
        })
        setEditingId(quote._id)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteDailyQuote(id)
            setMessage({ type: 'success', text: 'Deleted successfully!' })
            fetchQuotes()
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete' })
        } finally {
            setDeleteConfirm(null)
        }
    }

    const handleToggleActive = async (quote: DailyQuoteData) => {
        try {
            await updateDailyQuote(quote._id, { isActive: !quote.isActive } as any)
            fetchQuotes()
        } catch {
            setMessage({ type: 'error', text: 'Failed to toggle status' })
        }
    }

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

    const isToday = (dateString: string) =>
        new Date().toDateString() === new Date(dateString).toDateString()

    return (
        <div className="animate-fade-in space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Images</h1>
                    <p className="text-sm text-muted-foreground">Upload daily images for the Shree Jii app</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchQuotes} disabled={isLoading}
                        className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
                        <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    </button>
                    <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                        <Plus className="w-4 h-4" /> Add Image
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className={cn(
                    'p-3 rounded-lg text-sm flex items-center justify-between',
                    message.type === 'success'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                )}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-2"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                {editingId ? 'Edit Daily Image' : 'Add Daily Image'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                                    <Calendar className="w-4 h-4 inline mr-1.5" /> Date <span className="text-destructive">*</span>
                                </label>
                                <input type="date" value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                    required />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">
                                    <Image className="w-4 h-4 inline mr-1.5" /> Image <span className="text-destructive">*</span>
                                </label>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload}
                                    className="hidden" />
                                <button type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed border-border bg-background hover:border-primary/50 hover:bg-muted/50 transition-all text-sm text-muted-foreground disabled:opacity-50 cursor-pointer">
                                    {uploading ? (
                                        <><RefreshCw className="w-5 h-5 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><Upload className="w-5 h-5" /> Click to upload image</>
                                    )}
                                </button>
                                {form.imageUrl && (
                                    <div className="mt-3 rounded-lg overflow-hidden border border-border relative">
                                        <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-contain bg-muted" />
                                        <button type="button"
                                            onClick={() => setForm({ ...form, imageUrl: '' })}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <button type="submit" disabled={saving || !form.imageUrl}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium">
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                                <button type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}
                                    className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                            <div className="h-40 skeleton" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 w-2/3 skeleton rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : quotes.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center">
                    <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-foreground font-semibold mb-1">No images yet</h3>
                    <p className="text-sm text-muted-foreground">Upload your first daily image for the app</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {quotes.map((quote) => (
                        <div key={quote._id}
                            className={cn(
                                'bg-card border rounded-xl overflow-hidden transition-all hover:border-primary/30 group',
                                isToday(quote.date) ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border',
                                !quote.isActive && 'opacity-60'
                            )}>
                            {/* Image */}
                            <div className="relative h-40 bg-muted">
                                {quote.imageUrl ? (
                                    <img src={quote.imageUrl} alt="Daily" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Image className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                {isToday(quote.date) && (
                                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-medium">
                                        TODAY
                                    </span>
                                )}
                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <button onClick={() => handleToggleActive(quote)}
                                        className={cn('p-2 rounded-full transition-colors', quote.isActive ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-700')}
                                        title={quote.isActive ? 'Active' : 'Inactive'}>
                                        {quote.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleEdit(quote)}
                                        className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {deleteConfirm === quote._id ? (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleDelete(quote._id)}
                                                className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded-full">Yes</button>
                                            <button onClick={() => setDeleteConfirm(null)}
                                                className="px-2 py-1 text-xs bg-white/90 text-gray-700 rounded-full">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(quote._id)}
                                            className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Date */}
                            <div className="p-2.5 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{formatDate(quote.date)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
