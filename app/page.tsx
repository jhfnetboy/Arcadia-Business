import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma, testConnection } from "@/lib/prisma"
import Link from "next/link"
// import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { getUserStats } from "@/lib/queries/user-stats"

export default async function HomePage() {
  const session = await auth()
  const { user, userStats } = await getUserStats(session?.user?.email || '')

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
    <div className="flex flex-col gap-8 container py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Welcome back, {session.user.name}!</h1>
        <p className="text-xl text-muted-foreground">
          Your one-stop platform for digital coupons and rewards.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {user?.merchantProfile && (
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">Merchant Stats</h2>
            <div className="space-y-2">
              <p>Points Balance: {userStats.merchant.pointsBalance} PNTs</p>
              <p>Total Issued Coupons: {userStats.merchant.totalCoupons}</p>
              <p>Used Coupons: {userStats.merchant.usedCoupons}</p>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/merchant">Go to Merchant Dashboard</Link>
              </Button>
            </div>
          </div>
        )}

        {user?.playerProfile && (
          <div className="rounded-lg border p-6">
            <h2 className="text-2xl font-semibold mb-4">Player Stats</h2>
            <div className="space-y-2">
              <p>Points Balance: {userStats.player.pointsBalance} PNTs</p>
              <p>Total Coupons: {userStats.player.totalCoupons}</p>
              <p>Used Coupons: {userStats.player.usedCoupons}</p>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/player">Go to Player Dashboard</Link>
              </Button>
            </div>
          </div>
        )}

        {!user?.merchantProfile && !user?.playerProfile && (
          <div className="rounded-lg border p-6 col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-4">
              Choose your role to start exploring Arcadia:
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/merchant/new">Become a Merchant</Link>
              </Button>
              <Button asChild>
                <Link href="/player/new">Join as Player</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-2xl font-semibold mb-4">Explore Town</h2>
        <p className="text-muted-foreground mb-4">
          Let's begin your adventure in Arcadia from the town.
        </p>
        <Button asChild>
          <Link href="/town">Visit Town</Link>
        </Button>
      </div>
    </div>
  )
}
