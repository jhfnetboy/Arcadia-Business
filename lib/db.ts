import { prisma } from "./prisma"
import type { User, MerchantProfile, CouponTemplate, IssuedCoupon } from "@prisma/client"

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      merchantProfile: true,
    },
  })
}

export async function getMerchantProfile(userId: string) {
  return await prisma.merchantProfile.findUnique({
    where: { userId },
  })
}

export async function createMerchantProfile(
  userId: string,
  data: Omit<MerchantProfile, 'userId'> & { location: Record<string, any> | null }
) {
  return await prisma.merchantProfile.create({
    data: {
      ...data,
      userId,
      location: data.location ?? undefined,
    },
  })
}

export async function getCouponTemplates(merchantId?: string) {
  return await prisma.couponTemplate.findMany({
    where: merchantId ? { merchantId } : undefined,
    include: {
      merchant: true,
      category: true,
    },
  })
}

export async function getIssuedCoupons(userId: string) {
  return await prisma.issuedCoupon.findMany({
    where: { userId },
    include: {
      template: {
        include: {
          merchant: true,
        },
      },
    },
  })
}

export async function createCouponTemplate(
  merchantId: string,
  data: Omit<CouponTemplate, 'merchantId' | 'remainingQuantity'> & { settings: Record<string, any> | null }
) {
  return await prisma.couponTemplate.create({
    data: {
      ...data,
      merchantId,
      remainingQuantity: data.totalQuantity,
      settings: data.settings ?? {},
    },
  })
}

// 修改类型定义
interface IssueCouponData {
  passCode: string
  qrCode: string | null
}

// 修改创建优惠券的函数
export async function issueCoupon(
  templateId: string,
  userId: string,
  data: IssueCouponData
) {
  return await prisma.$transaction(async (tx) => {
    // 获取优惠券模板
    const template = await tx.couponTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      throw new Error("Coupon template not found")
    }

    // 检查剩余数量
    if (template.remainingQuantity <= 0) {
      throw new Error("No coupons remaining")
    }

    // 更新剩余数量
    await tx.couponTemplate.update({
      where: { id: templateId },
      data: {
        remainingQuantity: {
          decrement: 1
        }
      }
    })

    // 创建已发行优惠券
    return await tx.issuedCoupon.create({
      data: {
        ...data,
        templateId,
        userId,
        buyPrice: template.sellPrice, // 使用模板中的 sellPrice 作为 buyPrice
      }
    })
  })
}

export async function redeemCoupon(passCode: string) {
  return await prisma.issuedCoupon.update({
    where: { passCode },
    data: {
      status: "used",
      usedAt: new Date(),
    },
  })
}

export async function createRechargeCode(
  merchantId: string,
  points: number
) {
  const code = generateRechargeCode() // You need to implement this function
  return await prisma.rechargeCode.create({
    data: {
      code,
      points,
      merchantId,
    },
  })
}

export async function useRechargeCode(code: string) {
  // Start a transaction
  return await prisma.$transaction(async (tx) => {
    // Get and validate recharge code
    const rechargeCode = await tx.rechargeCode.findUnique({
      where: { code },
      include: { merchant: true },
    })

    if (!rechargeCode || rechargeCode.status === "used") {
      throw new Error("Invalid or used recharge code")
    }

    // Update recharge code status
    await tx.rechargeCode.update({
      where: { id: rechargeCode.id },
      data: {
        status: "used",
        usedAt: new Date(),
      },
    })

    // Update merchant points balance
    return await tx.merchantProfile.update({
      where: { id: rechargeCode.merchantId },
      data: {
        pointsBalance: {
          increment: rechargeCode.points,
        },
      },
    })
  })
}

// Helper function to generate recharge code
function generateRechargeCode() {
  return Math.random().toString(36).substring(2, 15).toUpperCase()
}

export async function createIssuedCoupon(
  userId: string,
  templateId: string,
  passCode: string,
  qrCode: string | null,
  buyPrice: number
) {
  return await prisma.issuedCoupon.create({
    data: {
      passCode,
      qrCode,
      templateId,
      userId,
      buyPrice,
    },
  })
} 