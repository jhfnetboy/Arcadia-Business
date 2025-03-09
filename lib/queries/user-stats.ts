import { prisma } from "@/lib/prisma"

export async function getUserStats(email: string) {
  const userStats = {
    merchant: {
      pointsBalance: 0,
      totalCoupons: 0,
      usedCoupons: 0
    },
    player: {
      pointsBalance: 0,
      totalCoupons: 0,
      usedCoupons: 0
    }
  }

  try {
    // 首先获取用户基本信息和关联的 profiles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        merchantProfile: true,
        playerProfile: true
      }
    })

    if (!user) return { user: null, userStats }

    if (user.merchantProfile) {
      // 获取商家创建的优惠券模板的总发行量
      const totalQuantityResult = await prisma.couponTemplate.aggregate({
        where: {
          merchantId: user.merchantProfile.id
        },
        _sum: {
          totalQuantity: true
        }
      })

      // 获取商家的已使用优惠券数量
      const usedCount = await prisma.transaction.count({
        where: {
          merchantId: user.merchantProfile.id
        }
      })

      userStats.merchant = {
        pointsBalance: user.merchantProfile.pointsBalance,
        totalCoupons: totalQuantityResult._sum.totalQuantity || 0,
        usedCoupons: usedCount
      }
    }

    if (user.playerProfile) {
      // 获取玩家领取的优惠券总数
      const totalCoupons = await prisma.issuedCoupon.count({
        where: {
          userId: user.playerProfile.id
        }
      })

      // 获取玩家已使用的优惠券数量
      const usedCoupons = await prisma.transaction.count({
        where: {
          userId: user.playerProfile.id
        }
      })

      userStats.player = {
        pointsBalance: user.playerProfile.pointsBalance,
        totalCoupons,
        usedCoupons
      }
    }

    return { user, userStats }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return { user: null, userStats }
  }
} 