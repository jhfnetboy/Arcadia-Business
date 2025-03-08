import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"

export default async function ClaimPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Claim PNTs</h1>
            <p className="text-gray-500">Your available PNTs will be shown here</p>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold mb-2">PNTs Balance</h2>
              <div className="text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-gray-500">Available PNTs</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 