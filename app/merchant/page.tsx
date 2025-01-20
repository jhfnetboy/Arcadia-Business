import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import WriteOffForm from "@/components/write-off-form"

export default async function MerchantDashboard() {
  const session = await auth()
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

  async function checkCoupon(formData: FormData) {
    "use server"
    
    const passcode = formData.get("passcode")
    if (!passcode || typeof passcode !== "string") {
      throw new Error("Please enter a valid coupon code")
    }

    const coupon = await prisma.issuedCoupon.findUnique({
      where: { passCode: passcode },
      include: {
        template: {
          include: {
            merchant: true,
          }
        },
        user: true
      }
    })

    if (!coupon) {
      throw new Error("Coupon not found. Please check the code and try again")
    }

    if (coupon.template.merchantId !== user.merchantProfile.id) {
      throw new Error("This coupon was not issued by your store")
    }

    if (coupon.status === "used") {
      const usedTime = coupon.usedAt?.toLocaleString() ?? "unknown time"
      throw new Error(`This coupon has already been redeemed at ${usedTime}`)
    }

    const now = new Date()
    const endDate = new Date(coupon.template.endDate)
    if (now > endDate) {
      const timeAgo = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      throw new Error(`This coupon expired ${timeAgo} days ago (Expiry: ${endDate.toLocaleString()})`)
    }

    return {
      id: coupon.id,
      name: coupon.template.name,
      description: coupon.template.description,
      playerName: coupon.user.name || "",
      playerEmail: coupon.user.email || "",
      promotionType: coupon.template.promotionType,
      discountType: coupon.template.discountType,
      discountValue: Number(coupon.template.discountValue), // Convert Decimal to Number
      status: coupon.status,
      createdAt: coupon.createdAt.toISOString(),
      expiresAt: coupon.template.endDate.toISOString(),
    }
  }

  async function redeemCoupon(id: string) {
    "use server"

    const coupon = await prisma.issuedCoupon.findUnique({
      where: { id },
      include: {
        template: true,
      }
    })

    if (!coupon) {
      throw new Error("Coupon not found")
    }

    if (coupon.template.merchantId !== user.merchantProfile.id) {
      throw new Error("This coupon was not issued by your store")
    }

    if (coupon.status === "used") {
      const usedTime = coupon.usedAt?.toLocaleString() ?? "unknown time"
      throw new Error(`This coupon has already been redeemed at ${usedTime}`)
    }

    const now = new Date()
    const endDate = new Date(coupon.template.endDate)
    if (now > endDate) {
      const timeAgo = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      throw new Error(`This coupon expired ${timeAgo} days ago (Expiry: ${endDate.toLocaleString()})`)
    }

    await prisma.issuedCoupon.update({
      where: { id },
      data: { 
        status: "used",
        usedAt: now
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.merchantProfile.businessName}</h1>
          <p className="text-muted-foreground">{user.merchantProfile.description}</p>
          <Button asChild variant="link" className="h-auto p-0 text-muted-foreground hover:text-primary">
            <Link href="/merchant/edit">Edit Profile</Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/merchant/coupons">My Coupons</Link>
          </Button>
          <Button asChild>
            <Link href="/merchant/coupons/new">Issue New Coupon</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/merchant/coupons/used">Used Coupons</Link>
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

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Write Off Coupons</h2>
        <WriteOffForm checkCoupon={checkCoupon} redeemCoupon={redeemCoupon} />
      </div>
    </div>
  )
} 