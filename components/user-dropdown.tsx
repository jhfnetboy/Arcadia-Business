'use client'

import { Button } from "./ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { UserAvatar } from "./auth-components"
import { handleSignOut } from "@/app/actions"

interface UserDropdownProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserDropdown({ user }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || user.email}
            </p>
            {user.email && (
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/claim" className="w-full cursor-pointer">
            Claim PNTs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full cursor-pointer">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <form
            action={handleSignOut}
            className="w-full"
          >
            <Button variant="ghost" className="w-full p-0">
              Sign Out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 