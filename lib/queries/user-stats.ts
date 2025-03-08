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
        merchantProfile: {
          include: {
            coupons: {
              include: {
                issuedCoupons: true
              }
            }
          }
        },
        playerProfile: true
      }
    })

    if (!user) return { user: null, userStats }

    if (user.merchantProfile) {
      // 获取商家发行的优惠券数量
      const issuedCount = await prisma.issuedCoupon.count({
        where: {
          templateId: {
            in: user.merchantProfile.coupons.map(c => c.id)
          }
        }
      })

      // 获取已使用的优惠券数量（通过 Transaction 表）
      const usedCount = await prisma.transaction.count({
        where: {
          couponId: {
            in: await prisma.issuedCoupon.findMany({
              where: {
                templateId: {
                  in: user.merchantProfile.coupons.map(c => c.id)
                }
              },
              select: {
                id: true
              }
            }).then(coupons => coupons.map(c => c.id))
          }
        }
      })

      userStats.merchant = {
        pointsBalance: user.merchantProfile.pointsBalance,
        totalCoupons: issuedCount,
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
          couponId: {
            in: await prisma.issuedCoupon.findMany({
              where: {
                userId: user.playerProfile.id
              },
              select: {
                id: true
              }
            }).then(coupons => coupons.map(c => c.id))
          }
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