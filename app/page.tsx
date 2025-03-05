import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma, testConnection } from "@/lib/prisma"
import Link from "next/link"
// import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export default async function HomePage() {
  const session = await auth()
  console.log("Session:", session)
  
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
            <h2 className="text-xl font-semibold">For Developers</h2>
            <p className="mt-2 text-muted-foreground">
              Integrate our API to build custom solutions for your business.
            </p>
            <Link 
              href="/docs"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 测试数据库连接
  try {
    const connectionTest = await testConnection()
    console.log("Database connection test:", connectionTest ? "SUCCESS" : "FAILED")
  } catch (error) {
    console.error("Error testing database connection:", error)
  }

  console.log("Attempting to find user with email:", session.user.email)

  try {
    // Get user with profiles and unused coupons
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        merchantProfile: true,
        playerProfile: true,
        issuedCoupons: {
          where: { usedAt: null },
          include: {
            template: {
              include: {
                merchant: true
              }
            }
          }
        }
      }
    })
    
    console.log("User query result:", user ? "Found user" : "User not found")

    if (!user) {
      console.log("User not found")
      redirect("/auth/signin")
    }

    const username = session.user.name || user.email.split('@')[0]

    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {username}</h1>
          <p className="text-muted-foreground">Get started with Arcadia - Your Gateway to Smart Business</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Merchant Section */}
          <Link 
            href={user.merchantProfile ? "/merchant" : "/merchant/new"}
            className="rounded-lg border p-6 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-xl font-semibold">Merchant</h2>
            {user.merchantProfile ? (
              <>
                <p className="mt-2 text-muted-foreground">
                  Manage your business, create promotions, and track results.
                </p>
                <div className="mt-4 text-sm font-medium text-primary">
                  Go to Merchant Dashboard
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-muted-foreground">
                  Set up your merchant profile to start creating promotions.
                </p>
                <div className="mt-4 text-sm font-medium text-primary">
                  Create Merchant Profile
                </div>
              </>
            )}
          </Link>

          {/* Player Section */}
          <Link 
            href={user.playerProfile ? "/player" : "/player/new"}
            className="rounded-lg border p-6 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-xl font-semibold">Player</h2>
            {user.playerProfile ? (
              <>
                <p className="mt-2 text-muted-foreground">
                  Browse promotions, use coupons, and earn rewards.
                </p>
                <div className="mt-4 text-sm font-medium text-primary">
                  Go to Player Dashboard
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-muted-foreground">
                  Set up your player profile to start using promotions.
                </p>
                <div className="mt-4 text-sm font-medium text-primary">
                  Create Player Profile
                </div>
              </>
            )}
          </Link>

          {/* Town Section */}
          <Link 
            href="/town"
            className="rounded-lg border p-6 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-xl font-semibold">Town</h2>
            <p className="mt-2 text-muted-foreground">
              Explore blockchain networks including Ethereum and Aptos.
            </p>
            <div className="mt-4 text-sm font-medium text-primary">
              Visit Town
            </div>
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching user data:", error)
    redirect("/auth/signin")
  }
}
