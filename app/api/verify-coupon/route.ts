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

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      )
    }

    const coupon = await prisma.issuedCoupon.findUnique({
      where: { passCode: code },
      include: {
        template: {
          include: {
            merchant: true
          }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    const now = new Date()
    const isExpired = now > coupon.template.endDate
    const timeLeft = coupon.template.endDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))

    return NextResponse.json({
      status: coupon.status,
      isExpired,
      daysLeft,
      merchantName: coupon.template.merchant.businessName,
      startDate: coupon.template.startDate,
      endDate: coupon.template.endDate
    })
  } catch (error) {
    console.error("Error verifying coupon:", error)
    return NextResponse.json(
      { error: "Failed to verify coupon" },
      { status: 500 }
    )
  }
} 