import type { User } from "@prisma/client"

const AVATAR_CACHE_KEY = 'user_avatar_cache'

interface AvatarCache {
  [userId: string]: {
    data: string  // base64 格式的图片数据
    timestamp: number
  }
}

// 缓存过期时间：15 天
const CACHE_EXPIRY = 15 * 24 * 60 * 60 * 1000

async function fetchAndConvertToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    return ''
  }
}

export function getCachedAvatar(userId: string): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}') as AvatarCache
    const cachedData = cache[userId]
    
    if (!cachedData) return null
    
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
      delete cache[userId]
      localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
      return null
    }
    
    return cachedData.data
  } catch (error) {
    console.error('Error reading avatar cache:', error)
    return null
  }
}

export async function cacheAvatar(userId: string, url: string): Promise<void> {
  if (typeof window === 'undefined') return
  
  try {
    const base64Data = await fetchAndConvertToBase64(url)
    if (!base64Data) return

    const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}') as AvatarCache
    
    cache[userId] = {
      data: base64Data,
      timestamp: Date.now()
    }
    
    localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error writing to avatar cache:', error)
  }
}

export async function getOrFetchAvatar(user: User): Promise<string> {
  if (!user?.id || !user?.image) return ''
  
  // 首先尝试从缓存获取
  const cachedData = getCachedAvatar(user.id)
  if (cachedData) {
    return cachedData
  }

  // 如果缓存中没有，获取并缓存
  await cacheAvatar(user.id, user.image)
  return user.image
} 