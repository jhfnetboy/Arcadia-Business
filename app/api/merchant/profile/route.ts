import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userData = await prisma.user.findUnique({
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

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!userData.merchantProfile) {
      return NextResponse.json(
        { error: "Merchant profile not found" },
        { status: 404 }
      )
    }

    const stats = {
      pointsBalance: userData.merchantProfile.pointsBalance,
      totalCoupons: {
        types: userData.merchantProfile.coupons.length,
        quantity: userData.merchantProfile.coupons.reduce(
          (acc, t) => acc + t.totalQuantity, 
          0
        )
      },
      activeCoupons: {
        types: userData.merchantProfile.coupons.filter(
          t => t.status === 'active'
        ).length,
        quantity: userData.merchantProfile.coupons
          .filter(t => t.status === 'active')
          .reduce(
            (acc, t) => acc + t.remainingQuantity, 
            0
          )
      },
      redeemedCoupons: userData.merchantProfile.coupons.reduce(
        (acc, t) => 
          acc + t.issuedCoupons.filter(
            ic => ic.status === 'used'
          ).length, 
        0
      )
    }

    return NextResponse.json({
      user: userData,
      stats
    })
  } catch (error) {
    console.error("Error fetching merchant profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch merchant profile" },
      { status: 500 }
    )
  }
} 