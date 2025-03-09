import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { action, code, id } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { merchantProfile: true }
    })

    if (!user || !user.merchantProfile) {
      return NextResponse.json(
        { error: "Merchant profile not found" },
        { status: 404 }
      )
    }

    if (action === 'check') {
      if (!code || typeof code !== "string") {
        return NextResponse.json(
          { error: "Please enter a valid coupon code" },
          { status: 400 }
        )
      }

      const coupon = await prisma.issuedCoupon.findUnique({
        where: { passCode: code },
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
        return NextResponse.json(
          { error: "Coupon not found. Please check the code and try again" },
          { status: 404 }
        )
      }

      const merchantProfileId = user.merchantProfile.id
      if (coupon.template.merchantId !== merchantProfileId) {
        return NextResponse.json(
          { error: "This coupon was not issued by your store" },
          { status: 403 }
        )
      }

      if (coupon.status === "used") {
        const usedTime = coupon.usedAt?.toLocaleString() ?? "unknown time"
        return NextResponse.json(
          { error: `This coupon has already been redeemed at ${usedTime}` },
          { status: 400 }
        )
      }

      const now = new Date()
      const endDate = new Date(coupon.template.endDate)
      if (now > endDate) {
        const timeAgo = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
        return NextResponse.json(
          { error: `This coupon expired ${timeAgo} days ago (Expiry: ${endDate.toLocaleString()})` },
          { status: 400 }
        )
      }

      return NextResponse.json({
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
      })
    } else if (action === 'redeem') {
      if (!id) {
        return NextResponse.json(
          { error: "Coupon ID is required" },
          { status: 400 }
        )
      }

      const coupon = await prisma.issuedCoupon.findUnique({
        where: { id },
        include: {
          template: true,
          user: true
        }
      })

      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 404 }
        )
      }

      const merchantProfileId = user.merchantProfile.id
      if (coupon.template.merchantId !== merchantProfileId) {
        return NextResponse.json(
          { error: "This coupon was not issued by your store" },
          { status: 403 }
        )
      }

      if (coupon.status === "used") {
        const usedTime = coupon.usedAt?.toLocaleString() ?? "unknown time"
        return NextResponse.json(
          { error: `This coupon has already been redeemed at ${usedTime}` },
          { status: 400 }
        )
      }

      const now = new Date()
      const endDate = new Date(coupon.template.endDate)
      if (now > endDate) {
        const timeAgo = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
        return NextResponse.json(
          { error: `This coupon expired ${timeAgo} days ago (Expiry: ${endDate.toLocaleString()})` },
          { status: 400 }
        )
      }

      await prisma.$transaction([
        prisma.issuedCoupon.update({
          where: { id },
          data: { 
            status: "used",
            usedAt: now
          },
        }),
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

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error processing write-off request:", error)
    return NextResponse.json(
      { error: "Failed to process write-off request" },
      { status: 500 }
    )
  }
} 