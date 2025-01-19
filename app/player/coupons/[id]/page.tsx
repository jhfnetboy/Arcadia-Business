import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { generatePasscode } from "@/lib/utils"
import type { Prisma } from "@prisma/client"

type CouponWithRelations = Prisma.CouponTemplateGetPayload<{
  include: {
    merchant: true
    category: true
  }
}>

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    playerProfile: true
    issuedCoupons: {
      include: {
        template: {
          include: {
            merchant: true
            category: true
          }
        }
      }
    }
  }
}>

export default async function CouponDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/player/coupons/${id}`)
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      playerProfile: true,
      issuedCoupons: {
        where: {
          templateId: id
        },
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
  }) as UserWithRelations | null
  
  if (!user) {
    redirect("/")
  }
  
  if (!user.playerProfile) {
    redirect("/player/new")
  }

  if (user.issuedCoupons.length > 0) {
    redirect(`/player/coupons/${id}/show`)
  }
  
  const coupon = await prisma.couponTemplate.findUnique({
    where: { id },
    include: {
      merchant: true,
      category: true
    }
  }) as CouponWithRelations | null
  
  if (!coupon) {
    redirect("/player/browse")
  }

  async function redeemCoupon() {
    "use server"

    if (!user?.playerProfile || !coupon) return

    if (user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30)) {
      throw new Error(`Insufficient points balance. Need ${coupon.sellPrice ?? 30} points but only have ${user.playerProfile.pointsBalance} points`)
    }

    const passCode = generatePasscode()

    await prisma.$transaction([
      prisma.playerProfile.update({
        where: { id: user.playerProfile.id },
        data: {
          pointsBalance: {
            decrement: coupon.sellPrice ?? 30
          }
        }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "coupon_purchase",
          amount: -(coupon.sellPrice ?? 30),
          status: "completed"
        }
      }),
      prisma.couponTemplate.update({
        where: { id: coupon.id },
        data: {
          remainingQuantity: {
            decrement: 1
          }
        }
      }),
      prisma.issuedCoupon.create({
        data: {
          templateId: coupon.id,
          userId: user.id,
          passCode,
          status: "unused"
        }
      })
    ])

    redirect(`/player/coupons/${id}/show`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupon Details</h1>
        <Button asChild variant="outline">
          <Link href="/player/browse">Back to Browse</Link>
        </Button>
      </div>
      
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{coupon.name}</h2>
            <p className="text-muted-foreground">{coupon.description}</p>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div>Category: {coupon.category.name}</div>
            <div>Merchant: {coupon.merchant.businessName}</div>
            <div>Price: {coupon.sellPrice ?? 30} points</div>
            <div>Available: {coupon.remainingQuantity} / {coupon.totalQuantity}</div>
            <div>Valid until: {new Date(coupon.endDate).toLocaleDateString()}</div>
          </div>
          
          <div className="mt-2">
            <div className="text-sm font-medium">Your Balance: {user.playerProfile.pointsBalance} points</div>
            {user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30) && (
              <p className="text-sm text-destructive">Insufficient points to redeem this coupon</p>
            )}
          </div>
          
          <form action={redeemCoupon}>
            <Button 
              type="submit"
              className="w-full"
              disabled={user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30)}
            >
              {user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30)
                ? `Insufficient points (need ${coupon.sellPrice ?? 30} points)`
                : `Redeem for ${coupon.sellPrice ?? 30} points`}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
} 