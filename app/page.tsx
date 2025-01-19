import { auth } from "auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const session = await auth()
  const email = session?.user?.email || ''
  
  // 邮箱隐私处理：保留开头和结尾，中间用 * 代替
  const maskedEmail = email.replace(/(?<=.{3}).(?=.*@)/g, '*')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border bg-card text-card-foreground shadow-sm">
        <h1 className="text-3xl font-bold text-center mb-2">Get New Customer in Web3</h1>
        <p className="text-xl text-muted-foreground">Arcadia - Smart Business</p>
        {session?.user ? (
          <p className="mt-4 text-sm text-muted-foreground">Welcome, {maskedEmail}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/merchant" className="group relative">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent">
            <div className="p-6">
              <h3 className="text-2xl font-semibold">Merchant</h3>
              <p className="text-sm text-muted-foreground">
                Register as a merchant to issue coupons and attract customers.
              </p>
            </div>
          </div>
        </Link>

        <Link href="/player" className="group relative">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent">
            <div className="p-6">
              <h3 className="text-2xl font-semibold">Player</h3>
              <p className="text-sm text-muted-foreground">
                Browse and redeem coupons from various merchants.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
