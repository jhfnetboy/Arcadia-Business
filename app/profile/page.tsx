import { auth } from "@/auth"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto p-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <UserAvatar 
              src={session.user.image || undefined} 
              alt={session.user.name || 'User avatar'}
              size={96}
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold">{session.user.name || 'User'}</h1>
              <p className="text-gray-500">{session.user.email}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold mb-2">Account Information</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {session.user.name || 'Not set'}</p>
                <p><span className="font-medium">Email:</span> {session.user.email || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 