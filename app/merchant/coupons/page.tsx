import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import type { CouponTemplate, CouponCategory, IssuedCoupon } from "@prisma/client"

// 定义包含关系的类型
interface CouponTemplateWithRelations extends CouponTemplate {
  category: CouponCategory;
  issuedCoupons: IssuedCoupon[];
}

// Helper function to format discount display
function formatDiscount(type: string, value: number): string {
  // Round to 2 decimal places
  const roundedValue = Number(value.toFixed(2))
  
  if (type === "percentage") {
    // Ensure percentage is between 0 and 100
    const normalizedValue = Math.max(0, Math.min(100, roundedValue))
    return `${normalizedValue}% off`
  }
 
  // For fixed amount discount
  return `$${roundedValue} off`
}

export default async function MerchantCouponsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/coupons")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      merchantProfile: {
        include: {
          coupons: {
            include: {
              category: true,
              issuedCoupons: true
            }
          }
        }
      }
    }
  })

  if (!user?.merchantProfile) {
    redirect("/merchant/new")
  }

  const coupons = user.merchantProfile.coupons

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Coupons</h1>
        <Button asChild>
          <Link href="/merchant/coupons/new">Create New Coupon</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {coupons.map((coupon: CouponTemplateWithRelations) => (
          <div key={coupon.id} className="rounded-lg border p-6">
            <div className="flex items-start gap-6">
              {coupon.image ? (
                <div className="relative aspect-square w-32 overflow-hidden rounded-lg">
                  <Image
                    src={coupon.image}
                    alt={coupon.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="relative aspect-square w-32 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{coupon.name}</h2>
                    <p className="text-muted-foreground">{coupon.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {coupon.status === 'active' ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                        {coupon.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div>{coupon.category.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Publish Price</div>
                    <div>{coupon.publishPrice} points</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Quantity</div>
                    <div>{coupon.remainingQuantity} / {coupon.totalQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Issued</div>
                    <div>{coupon.issuedCoupons.length}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/merchant/coupons/${coupon.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 