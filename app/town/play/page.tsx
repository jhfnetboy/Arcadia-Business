import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import PlayGameClient from "./client"

export default async function PlayGamePage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/town/play")
    return null
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Arcadia Game Center</h1>
        
        <div className="flex items-center">
          <Link href="/town" className="mr-4 text-blue-600 hover:text-blue-800">
            Back to Town
          </Link>
          
          <div className="flex items-center">
            {session.user.image && (
              <Image 
                src={session.user.image} 
                alt="Profile" 
                width={40} 
                height={40} 
                className="rounded-full mr-2"
              />
            )}
            <span className="text-sm font-medium">
              {session.user.name || session.user.email}
            </span>
          </div>
        </div>
      </div>
      
      <PlayGameClient user={session.user} />
    </div>
  )
}