import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MerchantTransactionsPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      merchantProfile: true,
      transactions: {
        where: {
          OR: [
            { type: "coupon_creation" },    // 发布优惠券
            { type: "recharge_points" }     // 充值积分
          ]
        },
        include: {
          coupon: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user?.merchantProfile) {
    redirect("/merchant/new")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            Current Balance: {user.merchantProfile.pointsBalance} points
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/merchant">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {user.transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">
                {transaction.type === "coupon_creation" ? (
                  <>
                    Created Coupon: {transaction.coupon?.name}
                    <div className="text-sm text-muted-foreground">
                      Quantity: {transaction.coupon?.totalQuantity}
                    </div>
                  </>
                ) : (
                  "Created Recharge Code"
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(transaction.createdAt).toLocaleString()}
              </div>
            </div>
            <div className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
              {transaction.amount > 0 ? "+" : ""}{transaction.amount} points
            </div>
          </div>
        ))}

        {user.transactions.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  )
} 