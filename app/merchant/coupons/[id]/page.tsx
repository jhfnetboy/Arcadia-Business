import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import type { NextPage } from "next";

// 定义基础类型
interface IssuedCoupon {
  id: string;
  status: string;
  passCode: string;
  usedAt: Date | null;
  user: {
    name: string | null;
  };
}

// 修改基础 Transaction 接口
interface Transaction {
  id: string;
  type: string;
  couponId: string | null;
  quantity: number;
  // 移除 couponTemplate，因为我们使用 coupon
}

// Define the type for params explicitly
interface CouponDetailPageProps {
  params: Promise<{ id: string }>; // Use Promise to match async behavior
  searchParams: Promise<{ error?: string }>;
}

// 定义 IssuedCouponWithUser 类型
interface IssuedCouponWithUser extends IssuedCoupon {
  user: {
    name: string | null
  }
}

// 修改 TransactionWithTemplate 接口
interface TransactionWithTemplate extends Omit<Transaction, 'couponTemplate'> {
  coupon: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    promotionType: string;
    merchantId: string;
    categoryId: string;
    description: string | null;
    discountType: string;
    sellPrice: number;
    // ... 其他需要的字段
  } | null;
}

const CouponDetailPage: NextPage<CouponDetailPageProps> = async ({
  params,
  searchParams,
}) => {
  const resolvedParams = await params; // Resolve the Promise
  const resolvedSearchParams = await searchParams; // Resolve the searchParams Promise
  const { id } = resolvedParams;
  const { error } = resolvedSearchParams; // Get the error if it exists

  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/merchant/coupons/${id}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { merchantProfile: true },
  });

  if (!user?.merchantProfile) {
    redirect("/merchant/new");
  }

  const coupon = await prisma.couponTemplate.findUnique({
    where: {
      id: id,
      merchantId: user.merchantProfile.id,
    },
    include: {
      category: true,
      issuedCoupons: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!coupon) {
    notFound();
  }

  // Group coupons by status
  const coupons = {
    unused: coupon.issuedCoupons.filter((c: IssuedCouponWithUser) => c.status === "unused"),
    used: coupon.issuedCoupons.filter((c: IssuedCouponWithUser) => c.status === "used"),
  };

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      OR: [
        { type: "coupon_creation" },
        { type: "recharge_points" }
      ]
    },
    include: {
      coupon: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="flex flex-col gap-6 container mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{coupon.name}</h1>
          <p className="text-muted-foreground">{coupon.description}</p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/merchant/coupons">Back to Coupons</Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Category</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{coupon.category.name}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Quantity</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{coupon.totalQuantity}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Remaining</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{coupon.remainingQuantity}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Used</div>
          <div className="mt-1 text-xl sm:text-2xl font-bold">{coupons.used.length}</div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Used Coupons</h2>
        </div>
        <div className="divide-y">
          {coupons.used.map((coupon: IssuedCouponWithUser) => (
            <div key={coupon.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {coupon.user.name
                      ? `${coupon.user.name.slice(0, 3)}${"*".repeat(coupon.user.name.length - 3)}`
                      : "Anonymous"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pass Code: {`${"*".repeat(4)}${coupon.passCode.slice(-4)}`}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Used at: {coupon.usedAt?.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {coupons.used.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No used coupons yet
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Transactions</h2>
        </div>
        <div className="divide-y">
          {transactions.map((transaction: TransactionWithTemplate) => (
            <div key={transaction.id} className="p-4">
              {transaction.type === "coupon_creation" ? (
                <>
                  Created Coupon (ID: {transaction.coupon?.id || "N/A"})
                  <div className="text-sm text-muted-foreground">
                    Quantity: {transaction.quantity}
                  </div>
                </>
              ) : (
                "Points Recharge"
              )}
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponDetailPage;