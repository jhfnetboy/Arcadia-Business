import Link from "next/link"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { SignOut } from "@/components/auth-components"

export async function SiteHeader() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Arcadia Business</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/merchant" className="text-sm font-medium">
              Merchant
            </Link>
            <Link href="/player" className="text-sm font-medium">
              Player
            </Link>
            <Link href="/town" className="text-sm font-medium">
              Town
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {session?.user ? (
            <SignOut user={session.user} />
          ) : (
            <Link href="/api/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 