"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@prisma/client"
import { useEffect, useState } from "react"
import { getOrFetchAvatar } from "@/lib/avatar-cache"

interface UserAvatarProps {
  user?: User
  src?: string
  alt?: string
  size?: number
  className?: string
}

export function UserAvatar({ user, src, alt, size, className }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>(src || '/default-avatar.png')

  useEffect(() => {
    const loadAvatar = async () => {
      if (user) {
        const url = await getOrFetchAvatar(user)
        setAvatarUrl(url)
      } else if (src) {
        setAvatarUrl(src)
      }
    }
    loadAvatar()
  }, [user, src])

  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined

  return (
    <Avatar className={className} style={style}>
      <AvatarImage src={avatarUrl} alt={alt || user?.name || 'User'} />
      <AvatarFallback>{user?.name?.charAt(0) || alt?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  )
} 