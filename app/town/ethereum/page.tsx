import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function EthereumPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/town/ethereum")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-600 to-gray-900">
      <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Ethereum</h1>
        <p className="text-white mb-8">Welcome to the Ethereum network</p>
        
        <div className="flex flex-col space-y-4">
          <p className="text-white">
            Ethereum is a decentralized, open-source blockchain with smart contract functionality.
            Ether is the native cryptocurrency of the platform.
          </p>
          
          <div className="mt-6">
            <Link href="/town">
              <Button className="w-full">Back to Town</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 