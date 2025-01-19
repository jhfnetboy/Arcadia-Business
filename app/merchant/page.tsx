import { auth } from "auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function MerchantDashboard() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/merchant")
  }

  // If signed in but not a merchant, redirect to role selection
  if (session.user.role && session.user.role !== "merchant") {
    redirect("/")
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
      <div className="text-muted-foreground">
        Welcome back, {session.user.name}
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-32">
          <a href="/merchant/coupons">
            <div className="flex flex-col items-center gap-2">
              <div className="font-semibold">Manage Coupons</div>
              <div className="text-sm text-muted-foreground">Create and manage your coupon templates</div>
            </div>
          </a>
        </Button>
        
        <Button asChild variant="outline" className="h-32">
          <a href="/merchant/redeem">
            <div className="flex flex-col items-center gap-2">
              <div className="font-semibold">Redeem Coupons</div>
              <div className="text-sm text-muted-foreground">Scan or enter coupon codes</div>
            </div>
          </a>
        </Button>
      </div>
    </div>
  )
} 