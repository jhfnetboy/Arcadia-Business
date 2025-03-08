"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@prisma/client"
import { useEffect, useState } from "react"
import { getOrFetchAvatar } from "@/lib/avatar-cache"

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png')

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return
      const url = await getOrFetchAvatar(user)
      setAvatarUrl(url)
    }
    loadAvatar()
  }, [user])

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  )
} 