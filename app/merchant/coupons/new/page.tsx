import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NewCouponForm from "@/components/new-coupon-form"

export default async function NewCouponPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/coupons/new")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      merchantProfile: true,
    }
  })

  if (!user || !user.merchantProfile) {
    redirect("/merchant/new")
  }

  // Get all coupon categories
  const categories = await prisma.couponCategory.findMany()

  async function createCoupon(formData: FormData) {
    "use server"
    
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const pointsPrice = Number.parseInt(formData.get("pointsPrice") as string, 10)
    const totalQuantity = Number.parseInt(formData.get("totalQuantity") as string, 10)
    const startDate = new Date(formData.get("startDate") as string)
    const endDate = new Date(formData.get("endDate") as string)
    const type = formData.get("type") as string
    const settings = formData.get("settings") as string

    if (!name || !description || !categoryId || !pointsPrice || !totalQuantity || !startDate || !endDate || !type || !settings) {
      throw new Error("Please fill in all required fields")
    }

    // Check if merchant has enough points
    if (user.merchantProfile.pointsBalance < pointsPrice * totalQuantity) {
      throw new Error("Insufficient points balance")
    }

    // Create coupon template and deduct points
    await prisma.$transaction([
      prisma.couponTemplate.create({
        data: {
          merchantId: user.merchantProfile.id,
          categoryId,
          name,
          description,
          type,
          settings: JSON.parse(settings),
          pointsPrice,
          totalQuantity,
          remainingQuantity: totalQuantity,
          startDate,
          endDate,
          status: "active"
        }
      }),
      prisma.merchantProfile.update({
        where: { id: user.merchantProfile.id },
        data: {
          pointsBalance: {
            decrement: pointsPrice * totalQuantity
          }
        }
      })
    ])

    redirect("/merchant")
  }

  return (
    <NewCouponForm 
      merchant={user.merchantProfile} 
      categories={categories}
      onSubmit={createCoupon} 
    />
  )
} 