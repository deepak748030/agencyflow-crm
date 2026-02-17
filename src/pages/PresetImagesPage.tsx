import { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react'
import api from '../lib/api'

interface PresetImage {
    _id: string
    imageUrl: string
    publicId: string
    isActive: boolean
    order: number
    createdAt: string
}

export function PresetImagesPage() {
    const [images, setImages] = useState<PresetImage[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchImages = useCallback(async () => {
        try {
            const res = await api.get('/preset-images/admin')
            if (res.data.success) setImages(res.data.response)
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchImages() }, [fetchImages])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('image', file)
            const res = await api.post('/preset-images/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data.success) {
                setImages(prev => [...prev, res.data.response])
            }
        } catch {
            // ignore
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const res = await api.delete(`/preset-images/${id}`)
            if (res.data.success) {
                setImages(prev => prev.filter(img => img._id !== id))
            }
        } catch {
            // ignore
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Preset Images</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload images that appear as presets in the Naam Jap Counter app
                    </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{uploading ? '' : 'Upload Image'}</span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-40" />
                    <p className="text-lg font-medium">No preset images yet</p>
                    <p className="text-sm">Upload images to show as presets in the app</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => (
                        <div
                            key={img._id}
                            className="relative group rounded-lg overflow-hidden border border-border bg-card aspect-square"
                        >
                            <img
                                src={img.imageUrl}
                                alt="Preset"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => handleDelete(img._id)}
                                disabled={deletingId === img._id}
                                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {deletingId === img._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
