import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TownPage() {
  const session = await auth()
  
  // If not signed in, show login page
  if (!session?.user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center" 
           style={{ backgroundImage: "url('/images/town-background.jpg')" }}>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
         style={{ backgroundImage: "url('/images/town-background.jpg')" }}>
      <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Town</h1>
        <p className="text-white mb-8">Hello, {session.user.name || session.user.email}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/town/ethereum">
            <Button className="w-full h-16 text-lg">Ethereum</Button>
          </Link>
          <Link href="/town/aptos">
            <Button className="w-full h-16 text-lg">Aptos</Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 