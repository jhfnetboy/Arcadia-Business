import { auth } from "auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MerchantTransactionsPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/transactions")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { 
      merchantProfile: true,
      transactions: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user?.merchantProfile) {
    redirect("/merchant/new")
  }

  function formatAmount(amount: number) {
    return amount > 0 ? `+${amount}` : amount.toString()
  }

  function formatTransactionType(type: string) {
    switch (type) {
      case "recharge":
        return "Points Recharge"
      case "coupon_creation":
        return "Coupon Creation"
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <Button asChild variant="outline">
          <Link href="/merchant">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Points Balance</CardTitle>
          <CardDescription>Your current available points for creating coupons</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{user.merchantProfile.pointsBalance} points</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your points transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">{formatTransactionType(transaction.type)}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.createdAt.toLocaleString()}
                  </p>
                </div>
                <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(transaction.amount)} points
                </p>
              </div>
            ))}
            {user.transactions.length === 0 && (
              <p className="text-center text-muted-foreground">No transactions found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 