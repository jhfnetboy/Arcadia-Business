'use client'

import Image from "next/image"

interface UserAvatarProps {
  src: string | null | undefined
  alt: string
  size?: number
}

export function UserAvatar({ src, alt, size = 50 }: UserAvatarProps) {
  if (!src) {
    return null
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image 
        src={src} 
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        priority
      />
    </div>
  )
} 