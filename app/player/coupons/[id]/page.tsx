import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CouponDetailPage({
  params: { id }
}: {
  params: { id: string }
}) {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/player/coupons/${id}`)
  }

  // Get user with player profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { playerProfile: true }
  })

  if (!user) {
    redirect("/")
  }

  // Get coupon template with merchant info
  const coupon = await prisma.couponTemplate.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          businessName: true,
          description: true,
          images: true
        }
      },
      category: true
    }
  })

  if (!coupon) {
    redirect("/player/browse")
  }

  // Check if user has already redeemed this coupon
  const existingCoupon = await prisma.issuedCoupon.findFirst({
    where: {
      templateId: id,
      userId: user.id
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/player/browse" 
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Browse
          </Link>
          <h1 className="text-3xl font-bold">{coupon.name}</h1>
        </div>
        {existingCoupon ? (
          <Button disabled>Already Redeemed</Button>
        ) : (
          <Button asChild>
            <Link href={`/player/coupons/redeem/${coupon.id}`}>Redeem Now</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground">{coupon.description}</p>
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-semibold">Promotion Details</h2>
              <div className="mt-2 grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{coupon.promotionType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Discount:</span>
                  <span>
                    {coupon.discountType === 'percentage' ? 
                      `${coupon.discountValue}% off` : 
                      `¥${coupon.discountValue} off`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{coupon.category.name}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Terms & Conditions</h2>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>• Valid from {new Date(coupon.startDate).toLocaleString()} to {new Date(coupon.endDate).toLocaleString()}</p>
                <p>• Limited quantity: {coupon.remainingQuantity} remaining out of {coupon.totalQuantity}</p>
                <p>• Points required: {coupon.publishPrice} points</p>
                <p>• One redemption per user</p>
                <p>• Cannot be combined with other promotions</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Merchant</h2>
            <div className="mt-4">
              <img
                src={coupon.merchant.images[0]}
                alt={coupon.merchant.businessName}
                className="mb-4 h-32 w-full rounded-md object-cover"
              />
              <h3 className="font-semibold">{coupon.merchant.businessName}</h3>
              <p className="text-sm text-muted-foreground">{coupon.merchant.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 