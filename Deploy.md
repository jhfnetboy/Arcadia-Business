import { PrismaClient } from "@prisma/client"
import { logDatabaseUrl, maskDatabaseUrl, getErrorDetails } from "./utils"

// Safely log database connection URL
logDatabaseUrl()

// Create Prisma client instance with explicit database URL and connection timeout
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    // Add connection timeout settings
    // @ts-ignore - These advanced options might not be included in Prisma types
    log: ['error', 'warn'],
    __internal: {
      engine: {
        connectionTimeout: 10000, // 10 seconds connection timeout
        queryEngineTimeout: 10000, // 10 seconds query timeout
      }
    }
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// 安全地记录数据库连接 URL
logDatabaseUrl(process.env.DATABASE_URL || '')

// 创建 Prisma 客户端实例，显式指定数据库 URL 和连接超时
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Test database connection
 * Attempts to execute a simple query to verify the connection is working
 */
export async function testConnection() {
  // Safely log database URL
  logDatabaseUrl()
  
  try {
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Database connection test successful:', result)
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * 创建一个新的 Prisma 客户端实例，使用不同的连接选项
 * 这对于测试不同的连接参数很有用
 */
export function createPrismaClient(options: {
  url?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  connectionTimeout?: number;
}) {
  const { url, ssl = true, connectionTimeout = 10000 } = options
  
  // 构建数据库 URL
  let dbUrl = url || process.env.DATABASE_URL || ''
  
  // 如果需要，添加或修改 SSL 参数
  if (typeof ssl === 'boolean') {
    if (dbUrl && !dbUrl.includes('sslmode=') && ssl) {
      dbUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}sslmode=require`
    } else if (dbUrl && dbUrl.includes('sslmode=') && !ssl) {
      dbUrl = dbUrl.replace(/sslmode=require/g, 'sslmode=prefer')
    }
  } else if (ssl && !ssl.rejectUnauthorized) {
    // 禁用 SSL 证书验证
    if (dbUrl.includes('sslmode=require')) {
      dbUrl = dbUrl.replace(/sslmode=require/g, 'sslmode=prefer')
    }
    if (!dbUrl.includes('sslmode=')) {
      dbUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}sslmode=prefer`
    }
  }
  
  // 安全地记录数据库 URL
  logDatabaseUrl(dbUrl, '创建新的 Prisma 客户端，URL');
  
  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error', 'warn'],
    // @ts-ignore
    __internal: {
      engine: {
        connectionTimeout,
        queryEngineTimeout: connectionTimeout,
      },
    },
  })
} 
5. Deploy project:
```bash
vercel --prod
```

### 5. GitHub Actions CI/CD Configuration

1. Add the following Secrets to your GitHub repository settings:
   - `VERCEL_TOKEN`: API token from Vercel
   - `VERCEL_ORG_ID`: Organization ID from Vercel
   - `VERCEL_PROJECT_ID`: Project ID from Vercel

2. Ensure `.github/workflows/ci.yml` file is correctly configured:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 6. Post-deployment Configuration

1. Set custom domain in Vercel console
2. Configure OAuth providers callback URLs:
   - Google: `https://your-domain.com/auth/callback/google`
   - GitHub: `https://your-domain.com/auth/callback/github`
   - Discord: `https://your-domain.com/auth/callback/discord`
   - Other providers...

3. Verify all environment variables are set correctly
4. Test authentication flow and main features

### 7. Middleware Configuration

In `middleware.ts`, we've configured authentication and performance monitoring middleware:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from "auth"

// Define middleware function
export function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  // Record request processing time
  const duration = Date.now() - start
  console.log(`${request.method} ${request.url} - ${duration}ms`)
  
  return response
}

// Export auth middleware
export default auth

// Configure middleware matcher
export const config = {
  matcher: ["/((?!auth|api|_next/static|_next/image|favicon.ico).*)"],
}
```

### 8. Monitoring and Maintenance

1. Set up Vercel Analytics
2. Configure error monitoring (Sentry optional)
3. Set up database backup strategy
4. Monitor database performance
5. Use the `captureError` function from `lib/monitoring.ts` to log errors:
```typescript
export function captureError(error: Error) {
  // Add error monitoring logic
  console.error(error)
  
  // Can integrate with Sentry or other services
}
```

## 常见问题 / Common Issues

### 数据库连接问题 / Database Connection Issues
- 检查 DATABASE_URL 格式
- 确认 Supabase 防火墙设置
- 验证数据库密码正确性

### 认证问题 / Authentication Issues
- 确保所有 OAuth 回调 URL 正确配置
- 验证 AUTH_SECRET 已正确设置
- 检查 OAuth 提供商的 API 密钥状态

### 部署失败 / Deployment Failures
- 检查 build 日志中的错误信息
- 验证所有必需的环境变量都已设置
- 确认 Node.js 版本兼容性

### 类型错误 / Type Errors
- 确保 `auth.ts` 中的类型定义正确
- 检查数据库操作中的类型定义
- 验证表单处理函数的返回类型

## 安全检查清单 / Security Checklist

- [ ] 环境变量安全存储
- [ ] 数据库连接使用 SSL
- [ ] OAuth 密钥定期轮换
- [ ] 启用数据库备份
- [ ] 配置错误监控
- [ ] 设置 CSP 头
- [ ] 启用 HTTPS
- [ ] 配置 CORS 策略
- [ ] 验证表单输入
- [ ] 实施速率限制
- [ ] 审核依赖项安全性

## 部署后验证清单 / Post-Deployment Verification Checklist

1. 验证认证流程 / Verify Authentication Flow
   - [ ] Google 登录
   - [ ] GitHub 登录
   - [ ] Discord 登录
   - [ ] 其他配置的 OAuth 提供商登录

2. 验证商家功能 / Verify Merchant Features
   - [ ] 商家注册
   - [ ] 商家资料编辑
   - [ ] 优惠券创建和管理
   - [ ] 优惠券核销

3. 验证玩家功能 / Verify Player Features
   - [ ] 玩家注册
   - [ ] 优惠券购买
   - [ ] 优惠券使用
   - [ ] 查看交易历史

4. 验证地图功能 / Verify Map Features
   - [ ] 地址搜索
   - [ ] 地图标记
   - [ ] 地理编码

5. 验证数据库操作 / Verify Database Operations
   - [ ] 数据创建
   - [ ] 数据查询
   - [ ] 数据更新
   - [ ] 事务处理

## 说明
我已经成功补充完整了部署指南，现在包含：
完整的环境变量配置：详细列出了所有必要的环境变量，包括数据库、认证、存储和 Google Maps 等配置。
数据库迁移步骤：添加了使用 Prisma 进行数据库管理的命令和步骤。
测试流程：包含了运行测试和检查测试覆盖率的步骤。
Vercel 部署流程：详细的 Vercel 部署步骤，包括 CLI 安装、登录和部署命令。
GitHub Actions CI/CD配置：添加了完整的CI/CD配置示例，包括测试和自动部署。
部署后配置：详细介绍了部署后的配置步骤，如设置自定义域名和配置 OAuth 提供商。
中间件配置：提供了中间件配置的详细示例代码。
监控和维护：添加了系统监控和维护的建议措施。
英文版本：添加了完整的英文版本部署指南，包含所有上述步骤。
常见问题：列出了常见问题及其解决方案，包括数据库连接、认证、部署和类型错误等问题。
安全检查清单：提供了全面的安全检查清单，帮助确保应用程序的安全性。
部署后验证清单：详细的部署后验证步骤，确保所有功能正常工作。
现在文档已经非常完整，包含了从环境设置到部署验证的所有必要信息，同时提供了中英文双语版本，方便不同用户参考。


DB test
    psql postgresql://postgres:password@db.ihxwzyizrwluxbvrfcyj.supabase.co:5432/postgres

    psql postgresql://postgres.ihxwzyizrwluxbvrfcyj:DC399EpjZ$Jfj$K@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

    
    postgresql://postgres.tbumaqkivvwqmyfuwqho:Epn*.aem*8$FGQc@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

    npx prisma db pull

    ping db.ihxwzyizrwluxbvrfcyj.supabase.co

    dig @8.8.8.8 db.myhost.supabase.co

### 重新初始化
```bash
rm -rf node_modules
rm -rf node_modules/.prisma
rm -rf .next
pnpm store prune
pnpm install
npx prisma generate
pnpm prisma generate
pnpm prisma db push


pnpm update
npx prisma db push
npx prisma db pull
npx prisma generate
npx prisma migrate dev --name init

```

## 数据库初始化
数据库需要初始化两个表：
```bash
npx prisma generate
npx ts-node data/seed-categories.ts
npx ts-node scripts/init-promotion-types.ts

npx ts-node scripts/add-recharge-transactions.ts
npx ts-node data/recharge-merchants.ts
npx ts-node data/recharge-players.ts

或者 node 23.x 以上
pnpm add -D tsx
npx prisma generate
npx tsx data/seed-categories.ts
npx tsx scripts/init-promotion-types.ts

npx tsx scripts/add-recharge-transactions.ts
npx tsx data/recharge-merchants.ts
npx tsx data/recharge-players.ts

npx prisma migrate dev --name add_image_to_coupon_temp

```

## happy flow 流程描述

1. player 通过 Email（google account）登录进入 town 页面，显示用户 Email，头像 :green_heart:
2. 目前先让 player 注册钱包地址（一个），后端在数据库中记录
3. 未来自动查询用户 Email 在后端数据库绑定的钱包地址，可以绑定多个（多链有多个）
4. 查询 player 钱包地址是否拥有指定 NFT 合约的 NFT
5. 没有则需要购买 NFT，进入页面购买
6. 如果拥有，则可以创建 hero，否则不能创建
7. 创建 hero 后，hero 会出现在 town 页面，并且可以进行管理
8. 下次登录，自动 loadHero
9. 至此 town 页面的初始化完成了
10. 点击进入 Game 冒险页面，开始冒险，携带基础信息
11. 冒险过程中，需要消耗能量，能量不足则不能进行冒险
12. 冒险中获得奖励，根据难度不同，奖励不同
13. 可以保存游戏，在 Game 内出发，修改 name，记录获得的积分，获得的装备，获得的 NFT coupon 等
14. Town 页面还可以使用积分，进行 skill 升级，装备（NFT）购买


### Transaction type

```javascript
  prisma.transaction.create({
        data: {
          userId: userWithProfile.id,
          type: "coupon_creation",
          amount: -totalPointsNeeded,
          status: "completed"
        }
  })
```

1. recharge_points: 充值 (从链上到节点)
2. coupon_creation: 创建优惠券
3. buy_coupon: 购买优惠券
4. write_off: 核销优惠券
5. buy_equipment: 购买装备
6. buy_skill: 购买技能
7. buy_nft: 购买 NFT

商家最关注的三个问题：

1. 积分余额：我有多少钱（余额）
   1.  MerchantProfile.pointsBalance, @default(0) @map("points_balance")
2. 积分明细：我花了多少（明细）
   1. coupon_creation：统计所有当前 merchantId 在 CouponTemplate 表 的 totalQuantity 乘以 publishPrice 的汇总
   2. 未来会有其他表的积分消耗，例如游戏内活动，游戏内抽奖，物理地址寻宝，游戏内持续任务等
3. 积分兑换：花钱效果如何（兑换）
   1. 统计所有当前 merchantId 在 Transaction 的 type 为 write_off 的，表示真正购买到的客户（优惠券被使用）
   2. 更多的其他表的消耗统计（TODO)

用户最关注的三个问题：
1. 积分余额：我有多少钱（余额）
   1. PlayerProfile.pointsBalance, @default(0) @map("points_balance")
2. 积分兑换：我花了多少钱（兑换）
   1. 统计所有当前 userId 在 Transaction 表的 type 为 buy_coupon 的记录 buyPrice 汇总
3. 兑换结果：我买到了多少（数量）
   1. 统计所有当前 userId 在 Transaction 表的 type 为 buy_coupon，buy_equipment，buy_skill，buy_nft 的记录汇总

### 统计查询函数 getUserStats

商家统计：
积分余额：直接从 merchantProfile.pointsBalance 获取
发行的优惠券总量：统计 CouponTemplate 表中该商家的 totalQuantity 总和
已使用的优惠券：统计 Transaction 表中 type="write_off" 的记录数

玩家统计：
积分余额：直接从 playerProfile.pointsBalance 获取
已用积分购物所得：统计所有类型为 buy_coupon、buy_equipment、buy_skill、buy_nft 的记录数
已使用的优惠券：统计 IssuedCoupon 表中 status="used" 的记录数


### 核销过程
改动说明：
核销流程改进：
在 redeemCoupon 函数中添加了创建 Transaction 记录的逻辑
使用 prisma.$transaction 确保优惠券状态更新和交易记录创建的原子性
设置交易类型为 "write_off"
使用优惠券的面值作为交易金额
添加了 merchantId 字段，使用商家的 userId
数据完整性：
在查询优惠券时增加了 user 关联，以获取用户信息
使用事务确保数据一致性，避免部分操作失败的情况
流程说明：
核销优惠券的入口是 WriteOffForm 组件中的 "Redeem" 按钮
验证优惠券的入口是页面底部的 "Verify" 按钮
完整流程是：先验证优惠券 -> 显示优惠券详情 -> 确认核销 -> 创建交易记录
这样修改后，每次核销优惠券时都会：
更新优惠券状态为 "used"
记录使用时间
创建一条类型为 "write_off" 的交易记录
关联商家 ID 和用户 ID
记录交易金额（优惠券面值）
这样就能正确追踪优惠券的使用情况和商家的核销记录。

有一个问题：
Transaction 表中存在 merchantId，String          @map("merchant_id") 和 merchant，User            @relation("MerchantTransactions", fields: [merchantId], references: [id])
这两个字段我观察是重复了，我计划保留 merchantId，因为 merchantId 是唯一标识，而 merchant 是关联的 User 对象，User 对象中也有 id 字段，所以可以保留 merchantId，然后删除 merchant 字段
请帮我完成这个修改，并给出修改后的代码，
包括但不限于
1. imigration 文件的生成和执行，
2. 检查所有和交易相关的页面的代码执行是否需要修改
3. 在核销页面，需要新增 type 为 write_off 的记录，并关联到对应的 CouponTemplate 和 IssuedCoupon


----

1. 首页的 Explore Town 区域，请使用 public/background.png 作为背景图，另外每次加载这个背景图的随机区域，不要缩放，而是随机显示区域能显示的大小
2.请扫描所有 page 页面代码的提示，请改为英文，每个在 app 下的页面
3. http://localhost:3000/merchant页面，Verify Coupon 区域，点击 verify，请查询 IssuedCoupon，显示 status（是否已经使用），是否在有效期，显示发行的 merchant 和有效期倒计时计算
4. 显示每个 write_off 且 merchantId 是登录帐号 merchanId 的记录，显示是 +30，是 merchant 的收入
5. @page.tsx 请修改 sellPrice 为 publishCost 的 1.2 倍，而不是默认的 30

首页整体上移一点，缩小点title和top的边距；town area缩小高度为原来的80%，visit town button 设置为灰蓝色，否则字体看不到