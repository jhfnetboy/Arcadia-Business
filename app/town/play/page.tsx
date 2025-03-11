import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import GlobalWalletConnect from "@/components/global-wallet-connect"
import PlayGameClient from "./client"

export default async function PlayGamePage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/town/play")
  }

  // If signed in, show the game page
  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Arcadia Game Center</h1>
          <p>Hello, {session.user.name || session.user.email}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/town">
            <Button variant="outline">Back to Town</Button>
          </Link>
          
          {/* Global Wallet Connection */}
          <GlobalWalletConnect />
        </div>
      </div>
      
      {/* Game Client Component */}
      <PlayGameClient user={session.user} />
      
      {/* Debug Info Area */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-medium mb-2">Debug Information</h3>
        <div id="debug-container" className="text-xs text-gray-700 max-h-60 overflow-y-auto">
          <p>Debug information will appear here</p>
        </div>
      </div>
    </div>
  )
}