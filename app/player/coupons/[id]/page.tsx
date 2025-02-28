import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { generatePasscode } from "@/lib/utils";
import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// 定义类型
type CouponWithRelations = Prisma.CouponTemplateGetPayload<{
  include: {
    merchant: true;
    category: true;
  };
}>;

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    playerProfile: true;
    issuedCoupons: {
      include: {
        template: {
          include: {
            merchant: true;
            category: true;
          };
        };
      };
    };
  };
}>;

// 定义页面 props 的接口
interface CouponDetailPageProps {
  params: Promise<{ id: string }>; // params 是 Promise 类型
  searchParams: Promise<{ error?: string }>; // searchParams 也是 Promise 类型
}

export default async function CouponDetailPage({ params, searchParams }: CouponDetailPageProps) {
  const resolvedParams = await params; // 解析 params
  const resolvedSearchParams = await searchParams; // 解析 searchParams
  const { id } = resolvedParams; // 获取 id
  const { error } = resolvedSearchParams; // 获取 error（如果存在）

  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/player/coupons/${id}`);
  }

  const user = (await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      playerProfile: true,
      issuedCoupons: {
        where: {
          templateId: id,
        },
        include: {
          template: {
            include: {
              merchant: true,
              category: true,
            },
          },
        },
      },
    },
  })) as UserWithRelations | null;

  if (!user) {
    redirect("/");
  }

  if (!user.playerProfile) {
    redirect("/player/new");
  }

  if (user.issuedCoupons.length > 0) {
    redirect(`/player/coupons/${id}/show`);
  }

  const coupon = (await prisma.couponTemplate.findUnique({
    where: { id: id },
    include: {
      merchant: true,
      category: true,
    },
  })) as CouponWithRelations | null;

  if (!coupon) {
    redirect("/player/browse");
  }

  async function redeemCoupon() {
    "use server";

    try {
      if (!user?.playerProfile || !coupon) return;

      // 1. 检查积分余额
      if (user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30)) {
        throw new Error(
          `积分不足。需要 ${coupon.sellPrice ?? 30} 积分，但只有 ${user.playerProfile.pointsBalance} 积分。`
        );
      }

      // 2. 检查优惠券有效性
      const now = new Date();

      let warningMessage = "";
      if (now < coupon.startDate) {
        warningMessage = `注意：此优惠券从 ${coupon.startDate.toLocaleString()} 开始有效`;
      }

      if (now > coupon.endDate) {
        throw new Error(`此优惠券已在 ${coupon.endDate.toLocaleString()} 过期`);
      }

      if (coupon.remainingQuantity <= 0) {
        throw new Error("此优惠券已售罄");
      }

      // 3. 生成兑换码和二维码
      const passCode = generatePasscode();
      const qrCode = await QRCode.toDataURL(passCode);

      // 4. 执行购买交易
      await prisma.$transaction([
        prisma.playerProfile.update({
          where: { id: user.playerProfile.id },
          data: {
            pointsBalance: {
              decrement: coupon.sellPrice ?? 30,
            },
          },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: "buy_coupon",
            amount: -(coupon.sellPrice ?? 30),
            status: "completed",
            couponId: coupon.id,
          },
        }),
        prisma.couponTemplate.update({
          where: { id: coupon.id },
          data: {
            remainingQuantity: {
              decrement: 1,
            },
          },
        }),
        prisma.issuedCoupon.create({
          data: {
            templateId: coupon.id,
            userId: user.id,
            passCode,
            qrCode,
            status: "unused",
            buyPrice: coupon.sellPrice ?? 30,
          },
        }),
      ]);

      // 刷新页面缓存
      revalidatePath(`/player/coupons/${id}`);

      // 如果有警告信息，重定向并附带消息
      if (warningMessage) {
        redirect(`/player/coupons/${id}/show?message=${encodeURIComponent(warningMessage)}`);
      } else {
        redirect(`/player/coupons/${id}/show`);
      }
    } catch (error) {
      // 重定向并附带错误信息
      redirect(
        `/player/coupons/${id}?error=${encodeURIComponent(
          error instanceof Error ? error.message : "发生错误"
        )}`
      );
    }
  }

  // 获取当前有效性状态
  const now = new Date();
  const isNotStarted = now < coupon.startDate;
  const isExpired = now > coupon.endDate;
  const isOutOfStock = coupon.remainingQuantity <= 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">优惠券详情</h1>
        <Button asChild variant="outline">
          <Link href="/player/browse">返回浏览</Link>
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{coupon.name}</h2>
            <p className="text-muted-foreground">{coupon.description}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <div>类别：{coupon.category.name}</div>
            <div>商家：{coupon.merchant.businessName}</div>
            <div>价格：{coupon.sellPrice ?? 30} 积分</div>
            <div>库存：{coupon.remainingQuantity} / {coupon.totalQuantity}</div>
            <div>
              有效期：{coupon.startDate.toLocaleDateString()} -{" "}
              {coupon.endDate.toLocaleDateString()}
            </div>
          </div>

          <div className="mt-2">
            <div className="text-sm font-medium">
              你的余额：{user.playerProfile.pointsBalance} 积分
            </div>
            {user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30) && (
              <p className="text-sm text-destructive">积分不足，无法兑换此优惠券</p>
            )}
            {isNotStarted && (
              <p className="text-sm text-yellow-600">
                注意：此优惠券从 {coupon.startDate.toLocaleString()} 开始有效
              </p>
            )}
            {isExpired && (
              <p className="text-sm text-destructive">
                此优惠券已于 {coupon.endDate.toLocaleString()} 过期
              </p>
            )}
            {isOutOfStock && (
              <p className="text-sm text-destructive">此优惠券已售罄</p>
            )}
            {error && (
              <p className="text-sm text-destructive mt-2">{decodeURIComponent(error)}</p>
            )}
          </div>

          <form action={redeemCoupon}>
            <Button
              type="submit"
              className="w-full"
              disabled={
                user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30) ||
                isExpired ||
                isOutOfStock
              }
            >
              {user.playerProfile.pointsBalance < (coupon.sellPrice ?? 30)
                ? `积分不足（需要 ${coupon.sellPrice ?? 30} 积分）`
                : isExpired
                ? "优惠券已过期"
                : isOutOfStock
                ? "已售罄"
                : `用 ${coupon.sellPrice ?? 30} 积分兑换`}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}