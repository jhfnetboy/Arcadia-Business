'use client'

import { useState, useCallback } from 'react'
import { Button } from "./ui/button"
import Image from "next/image"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
  className?: string
}

export function ImageUpload({ onUpload, currentImage, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const uploadImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('arcadia')
        .upload(`images/${filePath}`, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('arcadia')
        .getPublicUrl(`images/${filePath}`)

      onUpload(data.publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image!')
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  return (
    <div className={className}>
      {currentImage ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={currentImage}
            alt="Uploaded image"
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => document.getElementById('single')?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change'}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full aspect-square"
          onClick={() => document.getElementById('single')?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      )}
      <input
        type="file"
        id="single"
        accept="image/*"
        onChange={uploadImage}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}

interface MultipleImageUploadProps {
  onUpload: (urls: string[]) => void
  currentImages?: string[]
  maxImages?: number
  className?: string
}

export function MultipleImageUpload({
  onUpload,
  currentImages = [],
  maxImages = 3,
  className = ""
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const uploadImages = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select images to upload.')
      }

      const files = Array.from(event.target.files)
      const urls: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('arcadia')
          .upload(`images/${filePath}`, file)

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage
          .from('arcadia')
          .getPublicUrl(`images/${filePath}`)

        urls.push(data.publicUrl)
      }

      onUpload([...currentImages, ...urls].slice(0, maxImages))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error uploading images!')
    } finally {
      setUploading(false)
    }
  }, [onUpload, currentImages, maxImages])

  const removeImage = useCallback((index: number) => {
    const newImages = [...currentImages]
    newImages.splice(index, 1)
    onUpload(newImages)
  }, [currentImages, onUpload])

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {currentImages.map((url, index) => (
        <div key={url} className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={url}
            alt={`Uploaded image ${index + 1}`}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => removeImage(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      {currentImages.length < maxImages && (
        <Button
          variant="outline"
          className="aspect-square w-full"
          onClick={() => document.getElementById('multiple')?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Add Image'}
        </Button>
      )}
      <input
        type="file"
        id="multiple"
        accept="image/*"
        multiple
        onChange={uploadImages}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
} 