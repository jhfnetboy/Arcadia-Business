import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MerchantDashboardPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant")
  }

  // Get user with merchant profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      merchantProfile: {
        include: {
          coupons: {
            include: {
              issuedCoupons: true
            }
          }
        }
      }
    }
  })

  // If no user found, redirect to homepage
  if (!user) {
    redirect("/")
  }

  // If no merchant profile, redirect to new merchant page
  if (!user.merchantProfile) {
    redirect("/merchant/new")
  }

  const stats = {
    totalCoupons: user.merchantProfile.coupons.length,
    activeCoupons: user.merchantProfile.coupons.filter(t => t.status === 'active').length,
    issuedCoupons: user.merchantProfile.coupons.reduce((acc, t) => acc + t.issuedCoupons.length, 0),
    pointsBalance: user.merchantProfile.pointsBalance
  }

  // Display merchant dashboard
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.merchantProfile.businessName}</h1>
          <p className="text-muted-foreground">{user.merchantProfile.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/merchant/coupons">My Coupons</Link>
          </Button>
          <Button asChild>
            <Link href="/merchant/coupons/new">Issue New Coupon</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/merchant/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Points Balance</div>
          <div className="mt-1 text-2xl font-bold">{stats.pointsBalance}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalCoupons}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Active Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.activeCoupons}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Issued Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.issuedCoupons}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="text-sm text-muted-foreground">
            Coming soon...
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Popular Coupons</h2>
          <div className="text-sm text-muted-foreground">
            Coming soon...
          </div>
        </div>
      </div>
    </div>
  )
} 