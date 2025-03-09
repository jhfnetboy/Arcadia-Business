import { prisma } from "@/lib/prisma"

export async function getUserStats(email: string | undefined | null) {
  if (!email) {
    return {
      user: null,
      userStats: {
        merchant: { pointsBalance: 0, totalCoupons: 0, usedCoupons: 0 },
        player: { pointsBalance: 0, totalPurchases: 0, usedCoupons: 0 }
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      merchantProfile: true,
      playerProfile: true
    }
  })

  if (!user) {
    return {
      user: null,
      userStats: {
        merchant: { pointsBalance: 0, totalCoupons: 0, usedCoupons: 0 },
        player: { pointsBalance: 0, totalPurchases: 0, usedCoupons: 0 }
      }
    }
  }

  // 商家统计
  const merchantStats = user.merchantProfile ? {
    // 1. 积分余额
    pointsBalance: user.merchantProfile.pointsBalance,
    
    // 2. 发行的优惠券总量
    totalCoupons: await prisma.couponTemplate.aggregate({
      where: { merchantId: user.merchantProfile.id },
      _sum: { totalQuantity: true }
    }).then(result => result._sum.totalQuantity || 0),
    
    // 3. 已使用的优惠券数量
    usedCoupons: await prisma.transaction.count({
      where: {
        type: "write_off",
        userId: user.id
      }
    })
  } : { pointsBalance: 0, totalCoupons: 0, usedCoupons: 0 }

  // 玩家统计
  const playerStats = user.playerProfile ? {
    // 1. 积分余额
    pointsBalance: user.playerProfile.pointsBalance,
    
    // 2. 已用积分购物所得（所有购买类型的总数）
    totalPurchases: await prisma.transaction.count({
      where: {
        userId: user.id,
        type: {
          in: ["buy_coupon", "buy_equipment", "buy_skill", "buy_nft"]
        }
      }
    }),
    
    // 3. 已使用的优惠券数量
    usedCoupons: await prisma.issuedCoupon.count({
      where: {
        userId: user.id,
        status: "used"
      }
    })
  } : { pointsBalance: 0, totalPurchases: 0, usedCoupons: 0 }

  return {
    user,
    userStats: {
      merchant: merchantStats,
      player: playerStats
    }
  }
} 