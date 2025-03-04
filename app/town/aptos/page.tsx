import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AptosPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/town/aptos")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-gray-900">
      <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Aptos</h1>
        <p className="text-white mb-8">Welcome to the Aptos network</p>
        
        <div className="flex flex-col space-y-4">
          <p className="text-white">
            Aptos is a Layer 1 blockchain built with Move, a safe and reliable language that provides 
            flexibility to address key issues in blockchain development.
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