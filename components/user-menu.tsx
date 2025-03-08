'use client'

import Link from "next/link"
import { UserAvatar } from "./user-avatar"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { signOut } from "next-auth/react"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar 
            src={user.image} 
            alt={user.name || 'User avatar'}
            size={40}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && (
              <p className="font-medium">{user.name}</p>
            )}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/claim" className="w-full">
            Claim Points
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 