import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PlayerDashboard() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player")
  }

  // Get user with player profile and coupons
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      playerProfile: true,
      issuedCoupons: {
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

  // If no user found, redirect to homepage
  if (!user) {
    redirect("/")
  }

  // If no player profile, redirect to new player page
  if (!user.playerProfile) {
    redirect("/player/new")
  }

  // Group coupons by status
  const coupons = {
    unused: user.issuedCoupons.filter(c => c.status === "unused"),
    used: user.issuedCoupons.filter(c => c.status === "used"),
    expired: user.issuedCoupons.filter(c => c.status === "expired")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
        <Button asChild>
          <Link href="/player/browse">Browse Coupons</Link>
        </Button>
      </div>

      <div className="text-muted-foreground">
        Wallet Address: {user.playerProfile.walletAddress}
      </div>
      
      <div className="grid gap-6">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Coupons</h2>
          {user.issuedCoupons.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No coupons yet. Click "Browse Coupons" to get started.
            </div>
          ) : (
            <div className="grid gap-6">
              {Object.entries(coupons).map(([status, statusCoupons]) => (
                statusCoupons.length > 0 && (
                  <div key={status}>
                    <h3 className="mb-3 text-lg font-medium capitalize">{status} Coupons</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {statusCoupons.map((coupon) => (
                        <Link 
                          key={coupon.id} 
                          href={`/player/coupons/${coupon.id}`}
                          className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                        >
                          <h4 className="font-semibold">{coupon.template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {coupon.template.description}
                          </p>
                          <div className="mt-2 text-sm">
                            <div>Merchant: {coupon.template.merchant.businessName}</div>
                            <div>Pass Code: {coupon.passCode}</div>
                            {coupon.qrCode && <div>QR Code available</div>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 