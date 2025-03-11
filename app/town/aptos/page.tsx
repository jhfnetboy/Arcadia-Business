import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import GlobalWalletConnect from "@/components/global-wallet-connect"
import HeroSection from "../../../components/hero-section-aptos"
import NFTSection from "../../../components/nft-section-aptos"

export default async function AptosTownPage() {
  const session = await auth()
  
  // If not signed in, show login page
  if (!session?.user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6">Welcome to Aptos Town</h1>
          <p className="mb-8">Please sign in to continue</p>
          <Link 
            href="/auth/signin?callbackUrl=/town/aptos"
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
          <h1 className="text-3xl font-bold">Welcome to Aptos Town</h1>
          <p>Hello, {session.user.name || session.user.email}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Network Switch Button */}
          <Link href="/town">
            <Button variant="outline">Switch to Ethereum</Button>
          </Link>
          
          {/* Global Wallet Connection */}
          <GlobalWalletConnect />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* NFT Section - Using the new NFTSection component */}
        <NFTSection />
        
        {/* Your Heroes Section */}
        <HeroSection user={session.user} />
        
        {/* Your Assets Section */}
        <Card className="h-64">
          <CardHeader>
            <CardTitle>Your Aptos Assets</CardTitle>
            <CardDescription>View your Aptos tokens and other assets</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">No assets found</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>View Assets</Button>
          </CardFooter>
        </Card>
        
        {/* Buy in Shop Section */}
        <Card className="h-64">
          <CardHeader>
            <CardTitle>Buy in Aptos Shop</CardTitle>
            <CardDescription>Purchase new items and upgrades with Aptos</CardDescription>
          </CardHeader>
          <CardContent className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground">Shop coming soon</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>Visit Shop</Button>
          </CardFooter>
        </Card>
      </div>
      
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