import { auth } from "auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function PlayerDashboard() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/player")
  }

  // If signed in but not a player, redirect to role selection
  if (session.user.role && session.user.role !== "player") {
    redirect("/")
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Player Dashboard</h1>
      <div className="text-muted-foreground">
        Welcome back, {session.user.name}
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <Button asChild variant="outline" className="h-32">
          <a href="/player/coupons">
            <div className="flex flex-col items-center gap-2">
              <div className="font-semibold">My Coupons</div>
              <div className="text-sm text-muted-foreground">View and use your coupons</div>
            </div>
          </a>
        </Button>
        
        <Button asChild variant="outline" className="h-32">
          <a href="/player/browse">
            <div className="flex flex-col items-center gap-2">
              <div className="font-semibold">Browse Coupons</div>
              <div className="text-sm text-muted-foreground">Discover and redeem new coupons</div>
            </div>
          </a>
        </Button>
      </div>
    </div>
  )
} 