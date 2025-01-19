import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PlayerTransactionsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/player/transactions")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      playerProfile: true,
      transactions: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      issuedCoupons: {
        include: {
          template: {
            include: {
              merchant: true
            }
          }
        }
      }
    }
  })

  if (!user?.playerProfile) {
    redirect("/player/new")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">Current Balance: {user.playerProfile.points_balance} points</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/player">Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {user.transactions.map((transaction) => {
          // Find related coupon if this is a coupon purchase
          const coupon = user.issuedCoupons.find(
            c => c.createdAt.getTime() === transaction.createdAt.getTime()
          )?.template

          return (
            <div key={transaction.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">
                    {transaction.type === 'points_recharge' ? 'Points Recharge' :
                     transaction.type === 'coupon_purchase' && coupon ? `Purchased: ${coupon.name}` :
                     transaction.type}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.description || 
                     (coupon ? `From ${coupon.merchant.businessName}` : '')}
                  </div>
                </div>
                <div className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} points
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div>{new Date(transaction.createdAt).toLocaleString()}</div>
                {coupon && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/player/coupons/${coupon.id}`}>View Coupon</Link>
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {user.transactions.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No transactions yet.
          </div>
        )}
      </div>
    </div>
  )
} 