import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import WriteOffForm from "@/components/write-off-form"

// 首先定义一个 CouponType 接口
interface CouponType {
  totalQuantity: number
  remainingQuantity: number
  status: string
  issuedCoupons: {
    status: string
  }[]
}

export default async function MerchantDashboard() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant")
    return
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
    throw new Error("User is not logged in. Please log in first.")
  }

  // If no merchant profile, redirect to new merchant page
  if (!user.merchantProfile) {
    redirect("/merchant/new")
  }

  const stats = {
    pointsBalance: user.merchantProfile.pointsBalance,
    totalCoupons: {
      types: user.merchantProfile.coupons.length,
      quantity: user.merchantProfile.coupons.reduce(
        (acc: number, t: CouponType) => acc + t.totalQuantity, 
        0
      )
    },
    activeCoupons: {
      types: user.merchantProfile.coupons.filter(
        (t: CouponType) => t.status === 'active'
      ).length,
      quantity: user.merchantProfile.coupons
        .filter((t: CouponType) => t.status === 'active')
        .reduce(
          (acc: number, t: CouponType) => acc + t.remainingQuantity, 
          0
        )
    },
    redeemedCoupons: user.merchantProfile.coupons.reduce(
      (acc: number, t: CouponType) => 
        acc + t.issuedCoupons.filter(
          (ic: { status: string }) => ic.status === 'used'
        ).length, 
      0
    )
  }

  async function checkCoupon(formData: FormData) {
    "use server"
    
    const session = await auth()
    if (!session?.user?.email) {
      throw new Error("You must be logged in to check coupons")
    }

    // 重新获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { merchantProfile: true }
    })

    if (!user || !user.merchantProfile) {
      throw new Error("Merchant profile not found")
    }
    
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

    const merchantProfileId = user.merchantProfile.id
    if (coupon.template.merchantId !== merchantProfileId) {
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
      description: coupon.template.description || "",
      playerName: coupon.user.name || "",
      playerEmail: coupon.user.email || "",
      promotionType: coupon.template.promotionType,
      discountType: coupon.template.discountType,
      discountValue: Number(coupon.template.discountValue),
      status: coupon.status,
      createdAt: coupon.createdAt.toISOString(),
      expiresAt: coupon.template.endDate.toISOString(),
    }
  }

  async function redeemCoupon(id: string) {
    "use server"

    const session = await auth()
    if (!session?.user?.email) {
      throw new Error("You must be logged in to redeem coupons")
    }

    // 重新获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { merchantProfile: true }
    })

    if (!user || !user.merchantProfile) {
      throw new Error("Merchant profile not found")
    }

    const coupon = await prisma.issuedCoupon.findUnique({
      where: { id },
      include: {
        template: true,
        user: true
      }
    })

    if (!coupon) {
      throw new Error("Coupon not found")
    }

    const merchantProfileId = user.merchantProfile.id
    if (coupon.template.merchantId !== merchantProfileId) {
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

    // 使用事务来确保数据一致性
    await prisma.$transaction([
      // 更新优惠券状态
      prisma.issuedCoupon.update({
        where: { id },
        data: { 
          status: "used",
          usedAt: now
        },
      }),
      // 创建交易记录
      prisma.transaction.create({
        data: {
          userId: coupon.userId,
          merchantId: coupon.template.merchantId,
          type: "write_off",
          amount: Number(coupon.template.sellPrice),
          status: "completed",
          couponId: coupon.template.id,
          quantity: 1
        }
      })
    ])
  }

  // 创建一个新的函数用于表单提交
  async function handleCouponCheck(formData: FormData) {
    "use server"
    
    try {
      // 调用原来的 checkCoupon 函数获取优惠券信息
      const couponDetails = await checkCoupon(formData)
      // 这里可以添加处理逻辑，比如存储到服务器状态或重定向
      // 但不返回任何值
    } catch (error) {
      // 处理错误
      console.error("Error checking coupon:", error)
    }
    // 不返回任何值，符合 form action 的要求
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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Points Balance</div>
          <div className="mt-1 text-2xl font-bold">{stats.pointsBalance}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalCoupons.quantity}</div>
          <div className="text-sm text-muted-foreground">({stats.totalCoupons.types} types)</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Active Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.activeCoupons.quantity}</div>
          <div className="text-sm text-muted-foreground">({stats.activeCoupons.types} types)</div>
        </div>
        <div className="rounded-lg border p-4Write Off">
          <div className="text-sm text-muted-foreground">Redeemed Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.redeemedCoupons}</div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold"> Coupons</h2>
        <WriteOffForm checkCoupon={checkCoupon} redeemCoupon={redeemCoupon} />
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Verify Coupon</h2>
        </div>
        <div className="p-4">
          <form action={handleCouponCheck} className="flex gap-2">
            <input
              type="text"
              name="passcode"
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 border rounded-md"
              required
            />
            <Button type="submit">Verify</Button>
          </form>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {/* Recent Activity Section */}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Popular Coupons</h2>
        </div>
        <div className="divide-y">
          {/* Popular Coupons Section */}
        </div>
      </div>
    </div>
  )
} 