import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function BrowseCouponsPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player/browse")
  }

  // Get all active coupon templates with merchant info
  const coupons = await prisma.couponTemplate.findMany({
    where: {
      status: "active",
      startDate: { lte: new Date() },
      endDate: { gt: new Date() },
      remainingQuantity: { gt: 0 }
    },
    include: {
      merchant: {
        select: {
          businessName: true,
          description: true,
          images: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Group coupons by merchant
  const couponsByMerchant = coupons.reduce((acc, coupon) => {
    const merchantId = coupon.merchantId
    if (!acc[merchantId]) {
      acc[merchantId] = {
        merchantName: coupon.merchant.businessName,
        merchantDescription: coupon.merchant.description,
        merchantImage: coupon.merchant.images[0],
        coupons: []
      }
    }
    acc[merchantId].coupons.push(coupon)
    return acc
  }, {} as Record<string, { merchantName: string; merchantDescription: string | null; merchantImage: string; coupons: typeof coupons }>)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Browse Coupons</h1>
        <Button asChild variant="outline">
          <Link href="/player">My Coupons</Link>
        </Button>
      </div>

      <div className="grid gap-8">
        {Object.entries(couponsByMerchant).map(([merchantId, data]) => (
          <div key={merchantId} className="rounded-lg border p-6">
            <div className="mb-4 flex items-start gap-4">
              <img
                src={data.merchantImage}
                alt={data.merchantName}
                className="h-24 w-24 rounded-md object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold">{data.merchantName}</h2>
                <p className="text-muted-foreground">{data.merchantDescription}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.coupons.map((coupon) => (
                <div key={coupon.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">{coupon.name}</h3>
                  <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  <div className="mt-2 text-sm">
                    <div>Points: {coupon.pointsPrice}</div>
                    <div>Available: {coupon.remainingQuantity} / {coupon.totalQuantity}</div>
                    <div>Valid until: {new Date(coupon.endDate).toLocaleDateString()}</div>
                  </div>
                  <Button className="mt-4 w-full" asChild>
                    <Link href={`/player/coupons/redeem/${coupon.id}`}>Redeem</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(couponsByMerchant).length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No active coupons available at the moment.
          </div>
        )}
      </div>
    </div>
  )
} 