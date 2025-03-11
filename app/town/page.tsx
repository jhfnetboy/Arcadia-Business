import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import WalletSection from "@/components/wallet-section"
import HeroSection from "@/components/hero-section"

export default async function TownPage() {
  const session = await auth()
  
  // If not signed in, show login page
  if (!session?.user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6">Welcome to Town</h1>
          <p className="mb-8">Please sign in to continue</p>
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

  // If signed in, show the town page with sections
  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Town</h1>
          <p>Hello, {session.user.name || session.user.email}</p>
        </div>
        
        {/* Wallet Connection Section */}
        <WalletSection />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Your NFTs Section */}
        <Card className="h-64">
          <CardHeader>
            <CardTitle>Your NFTs</CardTitle>
            <CardDescription>View and manage your NFT collection</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">No NFTs found</p>
          </CardContent>
          <CardFooter>
            <Link href="/town/ethereum">
              <Button className="w-full">View NFTs</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Your Heroes Section */}
        <HeroSection user={session.user} />
        
        {/* Your Assets Section */}
        <Card className="h-64">
          <CardHeader>
            <CardTitle>Your Assets</CardTitle>
            <CardDescription>View your tokens and other assets</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">No assets found</p>
          </CardContent>
          <CardFooter>
            <Link href="/town/aptos">
              <Button className="w-full">View Assets</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Buy in Shop Section */}
        <Card className="h-64">
          <CardHeader>
            <CardTitle>Buy in Shop</CardTitle>
            <CardDescription>Purchase new items and upgrades</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">Shop coming soon</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>Visit Shop</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}