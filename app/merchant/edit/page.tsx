import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EditMerchantForm from "@/components/edit-merchant-form"

export default async function EditMerchantPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/edit")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchantProfile: true }
  })

  if (!user) {
    redirect("/")
  }

  if (!user.merchantProfile) {
    redirect("/merchant/new")
  }

  async function updateMerchantProfile(formData: FormData) {
    "use server"
    
    const businessName = formData.get("businessName") as string
    const description = formData.get("description") as string
    const address = formData.get("address") as string
    const location = formData.get("location") as string
    const images = formData.getAll("images") as string[]

    if (!businessName || !description || !address || !location || images.length < 3) {
      throw new Error("Please fill in all required fields and upload at least 3 images")
    }

    await prisma.merchantProfile.update({
      where: { userId: user.id },
      data: {
        businessName,
        description,
        address,
        location: JSON.parse(location),
        images
      }
    })

    redirect("/merchant")
  }

  return <EditMerchantForm merchant={user.merchantProfile} onSubmit={updateMerchantProfile} />
} 