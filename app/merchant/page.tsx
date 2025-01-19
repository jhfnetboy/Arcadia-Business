import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MerchantDashboard() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant")
  }

  // Get user with merchant profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      merchantProfile: true,
      issuedCoupons: true
    }
  })

  // If no user found, redirect to homepage
  if (!user) {
    redirect("/")
  }

  // If no merchant profile, redirect to new merchant page
  if (!user.merchantProfile) {
    redirect("/merchant/new")
  }

  // Display merchant dashboard
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.merchantProfile.businessName}</h1>
          <p className="text-muted-foreground">{user.merchantProfile.description}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/merchant/edit">Edit Profile</Link>
          </Button>
          <Button asChild>
            <Link href="/merchant/coupons/new">Issue New Coupon</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-2">Business Information</h2>
          <div className="grid gap-2">
            <div>
              <span className="font-medium">Address:</span> {user.merchantProfile.address}
            </div>
            <div>
              <span className="font-medium">Points Balance:</span> {user.merchantProfile.pointsBalance}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">Business Images</h2>
          <div className="grid grid-cols-3 gap-4">
            {user.merchantProfile.images.map((url, index) => (
              <img
                key={url}
                src={url}
                alt={`Business view ${index + 1}`}
                className="aspect-square rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 