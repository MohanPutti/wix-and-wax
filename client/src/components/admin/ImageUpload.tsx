import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../../services/api'
import Spinner from '../ui/Spinner'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setIsUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []
      for (const file of filesToUpload) {
        const response = await api.uploadImage(file)
        if (response.success) {
          uploadedUrls.push(response.data.url)
        }
      }
      onChange([...images, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      setError('Please drop image files only')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []
      for (const file of filesToUpload) {
        const response = await api.uploadImage(file)
        if (response.success) {
          uploadedUrls.push(response.data.url)
        }
      }
      onChange([...images, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {images.map((url, index) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
              <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 text-xs bg-amber-600 text-white px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-warm-300 rounded-lg p-8 text-center hover:border-amber-500 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Spinner />
              <p className="mt-2 text-warm-500">Uploading...</p>
            </div>
          ) : (
            <>
              <PhotoIcon className="h-12 w-12 mx-auto text-warm-400 mb-4" />
              <p className="text-warm-600 mb-2">
                Drag and drop images here, or click to select
              </p>
              <p className="text-sm text-warm-400">
                {images.length}/{maxImages} images • JPG, PNG, WebP, GIF up to 5MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
