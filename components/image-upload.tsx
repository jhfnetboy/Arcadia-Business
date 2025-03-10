'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "./ui/button"
import Image from "next/image"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRD

console.log('Supabase Configuration:', {
  url: supabaseUrl ? 'Set' : 'Not Set',
  key: supabaseKey ? 'Set' : 'Not Set'
})

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 存储桶状态类型
type BucketStatus = {
  isReady: boolean;
  error: string | null;
  isChecking: boolean;
}



// 生成唯一的文件名
function generateUniqueFileName(originalName: string): string {
  const timestamp = new Date().getTime()
  const random = Math.random().toString(36).substring(2, 15)
  const fileExt = originalName.split('.').pop()?.toLowerCase()
  return `${timestamp}-${random}.${fileExt}`
}

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
      console.log('Starting image upload...')

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      console.log('Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      // 验证文件类型
      if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
        throw new Error('Only jpg, jpeg, and png files are allowed.')
      }

      // 验证文件大小（2MB）
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB.')
      }

      const fileName = generateUniqueFileName(file.name)
      const filePath = `images/${fileName}`
      console.log('Generated file path:', filePath)

      const { error: uploadError, data } = await supabase.storage
        .from('arcadia')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload error: ${uploadError.message || 'Unknown error'}`)
      }

      if (!data) {
        throw new Error('Upload failed: No data returned')
      }

      console.log('Upload successful:', data)

      // 获取公共 URL
      console.log('Getting public URL for path:', filePath)
      const { data: urlData } = supabase.storage
        .from('arcadia')
        .getPublicUrl(filePath)

      console.log('URL Data response:', urlData)
      
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // 确保 URL 是完整的
      const publicUrl = new URL(urlData.publicUrl).toString()
      console.log('Final public URL:', publicUrl)
      onUpload(publicUrl)

    } catch (error) {
      console.error('Error uploading image:', error instanceof Error ? error.message : error)
      alert(error instanceof Error ? error.message : 'Error uploading image!')
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
            unoptimized
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
        accept="image/jpeg,image/jpg,image/png"
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
      
      // 验证文件类型和大小
      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase()
        if (!['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
          throw new Error(`File ${file.name} is not a supported image type. Only jpg, jpeg, and png files are allowed.`)
        }
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 2MB.`)
        }
      }


      const urls: string[] = []

      for (const file of files) {
        const fileName = generateUniqueFileName(file.name)
        const filePath = `images/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from('arcadia')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Error uploading ${file.name}: ${uploadError.message}`)
        }

        if (!data) {
          throw new Error(`Upload failed for ${file.name}: No data returned`)
        }

        console.log('Getting public URL for path:', filePath)
        const { data: urlData } = supabase.storage
          .from('arcadia')
          .getPublicUrl(filePath)

        console.log('URL Data response:', urlData)

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get public URL for ${file.name}`)
        }

        // 确保 URL 是完整的
        const publicUrl = new URL(urlData.publicUrl).toString()
        console.log('Final public URL:', publicUrl)
        urls.push(publicUrl)
      }

      onUpload([...currentImages, ...urls].slice(0, maxImages))
    } catch (error) {
      console.error('Error uploading images:', error instanceof Error ? error.message : error)
      alert(error instanceof Error ? error.message : 'Error uploading images!')
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
            unoptimized
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
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onChange={uploadImages}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
} 