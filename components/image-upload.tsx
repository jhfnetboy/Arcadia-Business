'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "./ui/button"
import Image from "next/image"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

// 检查存储桶是否存在并验证权限
async function checkBucketAndPermissions(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Checking for arcadia bucket...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return { 
        success: false, 
        message: `无法列出存储桶，请检查 Supabase 配置。错误: ${listError.message}` 
      }
    }

    console.log('Available buckets:', buckets?.map(b => ({ name: b.name, id: b.id })))
    const arcadiaBucket = buckets?.find(bucket => bucket.name === 'arcadia')
    
    if (!arcadiaBucket) {
      return { 
        success: false, 
        message: '未找到 arcadia 存储桶，请在 Supabase 控制台创建。' 
      }
    }

    console.log('Found arcadia bucket:', arcadiaBucket)

    // 测试上传权限
    try {
      console.log('Testing upload permissions...')
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const { error: uploadError } = await supabase.storage
        .from('arcadia')
        .upload('test/permission-check.txt', testFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload permission test failed:', uploadError)
        return { 
          success: false, 
          message: `上传权限测试失败: ${uploadError.message}` 
        }
      }

      // 如果成功上传，删除测试文件
      await supabase.storage
        .from('arcadia')
        .remove(['test/permission-check.txt'])

      console.log('Upload permission test successful')
      return { 
        success: true, 
        message: '存储桶检查成功，可以上传图片。' 
      }
    } catch (error) {
      console.error('Permission test error:', error)
      return { 
        success: false, 
        message: '验证上传权限失败，请检查存储桶策略。' 
      }
    }
  } catch (error) {
    console.error('Error in checkBucketAndPermissions:', error)
    return { 
      success: false, 
      message: `检查存储桶时发生错误: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
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
  const [bucketStatus, setBucketStatus] = useState<BucketStatus>({
    isReady: false,
    error: null,
    isChecking: true
  })

  // 组件加载时检查存储桶状态
  useEffect(() => {
    const checkBucket = async () => {
      const result = await checkBucketAndPermissions()
      setBucketStatus({
        isReady: result.success,
        error: result.success ? null : result.message,
        isChecking: false
      })
    }
    checkBucket()
  }, [])

  const uploadImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // 再次检查存储桶状态
      if (!bucketStatus.isReady) {
        const result = await checkBucketAndPermissions()
        if (!result.success) {
          throw new Error(result.message)
        }
      }

      setUploading(true)
      console.log('Starting single image upload...')

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

      // 检查存储桶和权限
      await checkBucketAndPermissions()

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
        throw new Error(`Upload error: ${uploadError.message}`)
      }

      if (!data) {
        throw new Error('Upload failed: No data returned')
      }

      console.log('Upload successful:', data)

      // 添加更多调试信息
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
  }, [onUpload, bucketStatus.isReady])

  // 如果正在检查存储桶状态
  if (bucketStatus.isChecking) {
    return (
      <div className={className}>
        <Button variant="outline" className="w-full aspect-square" disabled>
          正在检查存储配置...
        </Button>
      </div>
    )
  }

  // 如果存储桶检查失败
  if (!bucketStatus.isReady) {
    return (
      <div className={className}>
        <div className="w-full aspect-square border-2 border-dashed border-red-500 rounded-lg flex flex-col items-center justify-center p-4">
          <p className="text-red-500 text-center mb-2">存储配置错误</p>
          <p className="text-sm text-gray-500 text-center">{bucketStatus.error}</p>
        </div>
      </div>
    )
  }

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

      await checkBucketAndPermissions()

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