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
      </div>
      
      <PlayGameClient user={session.user} />
    </div>
  )
}