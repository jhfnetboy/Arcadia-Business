import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CouponDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player/coupons/" + params.id)
  }

  // Get coupon details with merchant info and category
  const coupon = await prisma.couponTemplate.findUnique({
    where: {
      id: params.id,
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
          images: true,
          address: true
        }
      },
      category: true
    }
  })

  if (!coupon) {
    notFound()
  }

  // Get promotion type details
  const promotionDetails = {
    type: coupon.promotionType,
    settings: coupon.settings,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/player/browse">← Back to Browse</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        {/* Merchant Info Section */}
        <div className="border-b p-6">
          <div className="flex items-start gap-6">
            <img
              src={coupon.merchant.images[0]}
              alt={coupon.merchant.businessName}
              className="h-32 w-32 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{coupon.merchant.businessName}</h1>
              <p className="mt-2 text-muted-foreground">{coupon.merchant.description}</p>
              <p className="mt-2 text-sm text-muted-foreground">{coupon.merchant.address}</p>
            </div>
          </div>
        </div>

        {/* Coupon Details Section */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{coupon.name}</h2>
            <p className="mt-2 text-muted-foreground">{coupon.description}</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Category</div>
              <div>{coupon.category.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Points Required</div>
              <div>{coupon.pointsPrice} points</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Available</div>
              <div>{coupon.remainingQuantity} / {coupon.totalQuantity}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Valid Period</div>
              <div>
                {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Promotion Details Section */}
          <div className="mb-6">
            <h3 className="font-semibold">Promotion Details</h3>
            <div className="mt-2 rounded-md bg-muted p-4">
              <div className="grid gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  {promotionDetails.type}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Discount: </span>
                  {promotionDetails.discountType === 'percentage' ? 
                    `${promotionDetails.discountValue}% off` : 
                    `¥${promotionDetails.discountValue} off`}
                </div>
                {Object.entries(promotionDetails.settings).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-muted-foreground">{key}: </span>
                    {String(value)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/player/coupons/redeem/${coupon.id}`}>
                Redeem for {coupon.pointsPrice} Points
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 