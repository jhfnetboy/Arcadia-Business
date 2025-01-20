import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default async function PlayerDashboard() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      playerProfile: true,
      issuedCoupons: {
        include: {
          template: {
            include: {
              merchant: true,
              category: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect("/")
  }

  if (!user.playerProfile) {
    redirect("/player/new")
  }

  // Group user's coupons by status
  const userCoupons = {
    unused: user.issuedCoupons.filter(c => c.status === "unused"),
    used: user.issuedCoupons.filter(c => c.status === "used")
  }

  return (
    <div className="flex flex-col gap-6 container mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Coupons</h1>
          <p className="text-muted-foreground">
            Points Balance: {user.playerProfile.points_balance}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/player/transactions">Transaction History</Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Unused Coupons</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{userCoupons.unused.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Used Coupons</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{userCoupons.used.length}</div>
        </div>
      </div>

      {/* Unused Coupons Section */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Unused Coupons</h2>
        </div>
        <div className="divide-y">
          {userCoupons.unused.map((coupon) => (
            <div key={coupon.id} className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {coupon.template.merchant.images?.[0] && (
                  <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={coupon.template.merchant.images[0]}
                      alt={coupon.template.merchant.business_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{coupon.template.name}</h3>
                      <p className="text-sm text-muted-foreground">{coupon.template.description}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">{coupon.template.merchant.business_name}</p>
                        <p className="text-sm text-muted-foreground">{coupon.template.merchant.address}</p>
                        {coupon.template.merchant.location && (
                          <a
                            href={`https://www.google.com/maps?q=${coupon.template.merchant.location.lat},${coupon.template.merchant.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View on Map
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {coupon.template.sell_price} points
                      </div>
                      <Button asChild className="mt-2" size="sm">
                        <Link href={`/player/coupons/${coupon.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {userCoupons.unused.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No unused coupons
            </div>
          )}
        </div>
      </div>

      {/* Used Coupons Section */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Used Coupons</h2>
        </div>
        <div className="divide-y">
          {userCoupons.used.map((coupon) => (
            <div key={coupon.id} className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {coupon.template.merchant.images?.[0] && (
                  <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden">
                    <Image
                      src={coupon.template.merchant.images[0]}
                      alt={coupon.template.merchant.business_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{coupon.template.name}</h3>
                      <p className="text-sm text-muted-foreground">{coupon.template.description}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium">{coupon.template.merchant.business_name}</p>
                        <p className="text-sm text-muted-foreground">{coupon.template.merchant.address}</p>
                        {coupon.template.merchant.location && (
                          <a
                            href={`https://www.google.com/maps?q=${coupon.template.merchant.location.lat},${coupon.template.merchant.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View on Map
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Used at: {coupon.usedAt?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {coupon.template.sell_price} points
                      </div>
                      <Button asChild className="mt-2" size="sm">
                        <Link href={`/player/coupons/${coupon.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {userCoupons.used.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No used coupons
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 