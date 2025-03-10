import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function TownPage() {
  const session = await auth()
  
  // If not signed in, show login page
  if (!session?.user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-black">
        <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-white mb-6">Welcome to Town</h1>
          <p className="text-white mb-8">Please sign in to continue</p>
          <Link 
            href="/auth/signin?callbackUrl=/town"
            className="block w-full text-center bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // If signed in, show the town page with buttons
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-black">
      <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
        <div className="flex items-center mb-6">
          {session.user.image && (
            <div className="mr-4">
              <Image 
                src={session.user.image} 
                alt="Profile" 
                width={50} 
                height={50} 
                className="rounded-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome to Town</h1>
            <p className="text-white">Hello, {session.user.name || session.user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Link href="/town/ethereum">
            <Button className="w-full h-16 text-lg">Ethereum</Button>
          </Link>
          <Link href="/town/aptos">
            <Button className="w-full h-16 text-lg">Aptos</Button>
          </Link>
          <Link href="/town/play">
            <Button className="w-full h-16 text-lg bg-green-600 hover:bg-green-700">Play Game</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}