import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// If signed in, show the town page with buttons
return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
       style={{ backgroundImage: "url('/images/town-background.jpg')" }}>
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
      </div>
    </div>
  </div>
)