'use client'

import Link from "next/link"
import Image from "next/image"
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
          {user.image && (
            <div className="relative w-10 h-10">
              <Image 
                src={user.image}
                alt={user.name || 'User avatar'}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          )}
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
        <DropdownMenuItem>
          <Link href="/claim">
            Claim PNTs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/profile">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut}>
          Sign Out 3
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 