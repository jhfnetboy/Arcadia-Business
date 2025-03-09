import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma, testConnection } from "@/lib/prisma"
import Link from "next/link"
// import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { getUserStats } from "@/lib/queries/user-stats"

function getRandomPosition() {
  // Generate random position between 0-70% to ensure some content is always visible
  const x = Math.floor(Math.random() * 70)
  const y = Math.floor(Math.random() * 70)
  return `${x}% ${y}%`
}

export default async function HomePage() {
  const session = await auth()
  const { user, userStats } = await getUserStats(session?.user?.email)

  // If not signed in, show welcome page
  if (!session?.user?.email) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Arcadia Smart Business</h1>
          <h2 className="text-muted-foreground">Get New Customers by Web3</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">For Merchants</h2>
            <p className="mt-2 text-muted-foreground">
              Attract new customers with smart promotions and loyalty programs.
            </p>
            <Link 
              href="/auth/signin?callbackUrl=/merchant/new"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Get Started
            </Link>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">For Players</h2>
            <p className="mt-2 text-muted-foreground">
              Discover exclusive deals and earn rewards at your favorite stores.
            </p>
            <Link 
              href="/auth/signin?callbackUrl=/player/new"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Get Started
            </Link>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">Visit Town</h2>
            <p className="mt-2 text-muted-foreground">
              Explore local businesses and discover self-pickup deals nearby.
            </p>
            <Link 
              href="/town"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Explore Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 container py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
        <p className="text-lg text-muted-foreground">
          Arcadia: Begin Your Web3 Journey!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Merchant Dashboard</h2>
          {user?.merchantProfile ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Points Balance:</span>
                  <span className="font-medium">{userStats.merchant.pointsBalance} PNTs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Issued Coupons:</span>
                  <span className="font-medium">{userStats.merchant.totalCoupons}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Used Coupons:</span>
                  <span className="font-medium">{userStats.merchant.usedCoupons}</span>
                </div>
              </div>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/merchant">Go to Merchant Dashboard</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Register as a merchant to start creating and managing digital coupons for your business.
              </p>
              <Button asChild>
                <Link href="/merchant/new">Register as Merchant</Link>
              </Button>
            </>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">Player Dashboard</h2>
          {user?.playerProfile ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Points Balance:</span>
                  <span className="font-medium">{userStats.player.pointsBalance} PNTs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Purchases:</span>
                  <span className="font-medium">{userStats.player.totalPurchases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Used Coupons:</span>
                  <span className="font-medium">{userStats.player.usedCoupons}</span>
                </div>
              </div>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/player">Go to Player Dashboard</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                Join as a player to discover exclusive deals and earn rewards at your favorite stores.
              </p>
              <Button asChild>
                <Link href="/player/new">Register as Player</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <section 
        className="relative h-[240px] overflow-hidden rounded-lg border group"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundPosition: getRandomPosition(),
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 group-hover:bg-black/30">
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-white mb-3">Explore Town</h2>
            <p className="text-lg text-white/90 mb-4">Discover amazing world in Arcadia</p>
            <Button asChild variant="secondary" className="hover:bg-white/90">
              <Link href="/town">Visit Town</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
