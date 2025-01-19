import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NewCouponForm from "@/components/new-coupon-form"
import { Prisma } from "@prisma/client"

// Helper function to format date for display
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get default start and end dates
function getDefaultDates() {
  const now = new Date()
  const startDate = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
  const endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
  return { startDate, endDate }
}

export default async function NewCouponPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/coupons/new")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchantProfile: true }
  })

  if (!user?.merchantProfile) {
    redirect("/merchant/new")
  }

  // Get coupon categories for the form
  const categories = await prisma.couponCategory.findMany({
    orderBy: { name: 'asc' }
  })

  async function createCoupon(formData: FormData) {
    "use server"

    if (!user || !user.merchantProfile) {
      throw new Error("Merchant profile not found")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const type = formData.get("type") as string
    const settings = JSON.parse(formData.get("settings") as string)
    const totalQuantity = Number.parseInt(formData.get("totalQuantity") as string, 10)
    const pointsPrice = Number.parseInt(formData.get("pointsPrice") as string, 10)
    
    // Get start and end dates from form, fallback to default dates if not provided
    const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDates()
    const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : defaultStart
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : defaultEnd

    // Validate required fields
    if (!name || !description || !categoryId || !type || !settings || 
        !totalQuantity || !pointsPrice || !startDate || !endDate) {
      throw new Error("Please fill in all required fields")
    }

    // Validate numeric values with friendly messages
    if (totalQuantity <= 0) {
      throw new Error("Please enter a valid quantity (must be greater than 0)")
    }
    if (pointsPrice <= 0) {
      throw new Error("Please enter a valid points price (must be greater than 0)")
    }

    // Validate dates with friendly messages
    const now = new Date()
    if (startDate < now) {
      throw new Error(`Start date must be in the future. Please select a date after ${formatDate(now)}`)
    }
    if (endDate <= startDate) {
      throw new Error(`End date (${formatDate(endDate)}) must be after start date (${formatDate(startDate)})`)
    }

    // Calculate total points needed for all coupons
    // Points needed = points price per coupon × total quantity
    const totalPointsNeeded = pointsPrice * totalQuantity

    // Check if merchant has enough points balance
    if (user.merchantProfile.pointsBalance < totalPointsNeeded) {
      throw new Error(`Insufficient points balance. Need ${totalPointsNeeded} points but only have ${user.merchantProfile.pointsBalance} points. Please recharge points first.`)
    }

    // Determine discount type and value based on promotion type
    let discountType: string
    let discountValue: number

    // For percentage discounts (e.g. 0.8 for 20% off)
    if (settings.calculate === "multi") {
      discountType = "percentage"
      discountValue = (1 - settings.num) * 100 // Convert to percentage off (e.g. 20 for 20% off)
    } else {
      // For fixed amount discounts (e.g. 100 for $100 off)
      discountType = "fixed"
      discountValue = settings.num
    }

    // Use transaction to ensure data consistency:
    // 1. Create coupon template
    // 2. Deduct points from merchant balance
    // 3. Create transaction record
    await prisma.$transaction([
      // Create coupon template
      prisma.couponTemplate.create({
        data: {
          merchantId: user.merchantProfile.id,
          categoryId,
          name,
          description,
          promotionType: type, // Use promotionType as defined in schema
          settings,
          discountType,
          discountValue: new Prisma.Decimal(discountValue),
          pointsPrice,
          totalQuantity,
          remainingQuantity: totalQuantity,
          startDate,
          endDate,
          status: "active"
        }
      }),
      // Deduct total points from merchant balance
      prisma.merchantProfile.update({
        where: { id: user.merchantProfile.id },
        data: {
          pointsBalance: {
            decrement: totalPointsNeeded
          }
        }
      }),
      // Create transaction record for points deduction
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "coupon_creation",
          amount: -totalPointsNeeded,
          status: "completed"
        }
      })
    ])

    redirect("/merchant/coupons")
  }

  const { startDate, endDate } = getDefaultDates()

  return <NewCouponForm 
    categories={categories} 
    merchant={{
      id: user.merchantProfile.id,
      pointsBalance: user.merchantProfile.pointsBalance
    }}
    defaultDates={{
      startDate,
      endDate
    }}
    onSubmit={createCoupon} 
  />
} 