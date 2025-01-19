import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NewMerchantForm from "@/components/new-merchant-form"

export default async function NewMerchantPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/new")
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchantProfile: true }
  })

  // If no user found, redirect to homepage
  if (!user) {
    redirect("/")
  }

  // If merchant profile exists, redirect to merchant dashboard
  if (user.merchantProfile) {
    redirect("/merchant")
  }

  async function createMerchantProfile(formData: FormData) {
    "use server"

    const businessName = formData.get("businessName") as string
    const description = formData.get("description") as string
    const address = formData.get("address") as string
    const location = formData.get("location") as string
    const images = formData.getAll("images") as string[]

    if (!businessName || !description || !address || !location || images.length < 3) {
      throw new Error("Please fill in all required fields and upload at least 3 images")
    }

    await prisma.merchantProfile.create({
      data: {
        userId: user.id,
        businessName,
        description,
        address,
        location: JSON.parse(location),
        images,
        pointsBalance: 0
      }
    })

    redirect("/merchant")
  }

  return <NewMerchantForm onSubmit={createMerchantProfile} />
} 