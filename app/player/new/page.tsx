import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NewPlayerForm from "@/components/new-player-form"

// 创建一个自定义错误类来处理用户友好的错误
class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserError'
  }
}

export default async function NewPlayerPage() {
  const session = await auth()
  
  // If not signed in, redirect to sign in page
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player/new")
    return
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { playerProfile: true }
  })

  // If no user found, redirect to homepage
  if (!user) {
    throw new UserError("User not found")
  }

  // If player profile exists, redirect to player dashboard
  if (user.playerProfile) {
    redirect("/player")
  }

  async function createPlayerProfile(formData: FormData) {
    "use server"

    const session = await auth()
    if (!session?.user?.email) {
      throw new UserError("You must be logged in to create a player profile")
    }

    // 重新获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      throw new UserError("User not found")
    }

    const walletAddress = formData.get("walletAddress") as string

    if (!walletAddress) {
      throw new UserError("Please provide a wallet address")
    }

    // Check if wallet address is already in use
    const existingProfile = await prisma.playerProfile.findUnique({
      where: { walletAddress }
    })

    if (existingProfile) {
      throw new UserError("This wallet address is already registered")
    }

    try {
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          walletAddress
        }
      })
    } catch (error) {
      console.error("Failed to create player profile:", error)
      throw new UserError("Failed to create player profile")
    }

    redirect("/player")
  }

  return <NewPlayerForm onSubmit={createPlayerProfile} />
} 