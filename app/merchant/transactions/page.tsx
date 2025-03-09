import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/merchant/transactions")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchantProfile: true }
  })

  if (!user?.merchantProfile) {
    redirect("/merchant/new")
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      merchantId: user.merchantProfile.id,
      OR: [
        { type: "write_off" },
        { type: "recharge_points" },
        { type: "buy_coupon" }
      ],
      status: "completed"
    },
    include: {
      user: true,
      coupon: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">View your transaction history</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/merchant">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">All Transactions</h2>
        </div>
        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No transactions found
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <div className={`font-medium ${tx.type === 'write_off' || tx.type === 'recharge_points' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'write_off' ? '+30' : tx.type === 'recharge_points' ? `+${tx.amount}` : tx.amount} points
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tx.type === 'write_off' ? 'From' : tx.type === 'recharge_points' ? 'Recharge' : 'Purchase'}: {tx.user.name || tx.user.email}
                  </div>
                  {tx.coupon && (
                    <div className="text-sm text-muted-foreground">
                      Coupon: {tx.coupon.name}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Completed
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 