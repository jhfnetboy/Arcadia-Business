'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, CheckCircleIcon, XCircleIcon, DatabaseIcon, UserIcon, UserPlusIcon } from 'lucide-react'

// 定义响应类型
type TestResponse = {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export default function DbTestPage() {
  // 状态管理
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    connection: false,
    findUser: false,
    createUser: false
  })
  const [results, setResults] = useState<{[key: string]: TestResponse | null}>({
    connection: null,
    findUser: null,
    createUser: null
  })

  // 测试数据库连接
  const testConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }))
    try {
      const response = await fetch('/api/db-test/connection')
      const data = await response.json()
      setResults(prev => ({ ...prev, connection: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        connection: { 
          success: false, 
          message: `测试连接失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, connection: false }))
    }
  }

  // 查询用户
  const findUser = async () => {
    setLoading(prev => ({ ...prev, findUser: true }))
    try {
      const response = await fetch('/api/db-test/find-user')
      const data = await response.json()
      setResults(prev => ({ ...prev, findUser: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        findUser: { 
          success: false, 
          message: `查询用户失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, findUser: false }))
    }
  }

  // 创建用户
  const createUser = async () => {
    setLoading(prev => ({ ...prev, createUser: true }))
    try {
      const response = await fetch('/api/db-test/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test-user-${Date.now()}@example.com`,
          name: `测试用户 ${new Date().toLocaleString('zh-CN')}`
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, createUser: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        createUser: { 
          success: false, 
          message: `创建用户失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, createUser: false }))
    }
  }

  // 渲染测试结果
  const renderResult = (result: TestResponse | null) => {
    if (!result) return null

    return (
      <Alert variant={result.success ? "default" : "destructive"}>
        <div className="flex items-center gap-2">
          {result.success ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
          <AlertTitle>{result.success ? '成功' : '失败'}</AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          {result.message}
          {result.data && (
            <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">数据库连接测试</h1>
      <p className="text-muted-foreground mb-8">
        此页面用于测试与 Supabase 数据库的连接，并执行基本的数据库操作。
      </p>

      <div className="grid gap-6">
        {/* 测试连接 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              测试数据库连接
            </CardTitle>
            <CardDescription>
              测试应用是否能够连接到 Supabase 数据库
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.connection && renderResult(results.connection)}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testConnection} 
              disabled={loading.connection}
            >
              {loading.connection ? '测试中...' : '测试连接'}
            </Button>
          </CardFooter>
        </Card>

        {/* 查询用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              查询用户
            </CardTitle>
            <CardDescription>
              尝试从数据库中查询用户列表
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.findUser && renderResult(results.findUser)}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={findUser} 
              disabled={loading.findUser}
              variant="outline"
            >
              {loading.findUser ? '查询中...' : '查询用户'}
            </Button>
          </CardFooter>
        </Card>

        {/* 创建用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              创建用户
            </CardTitle>
            <CardDescription>
              尝试在数据库中创建一个新用户
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.createUser && renderResult(results.createUser)}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createUser} 
              disabled={loading.createUser}
              variant="outline"
            >
              {loading.createUser ? '创建中...' : '创建用户'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">环境信息</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          当前使用的数据库连接字符串（部分隐藏）:
        </p>
        <pre className="bg-background p-2 rounded text-xs overflow-auto">
          {process.env.DATABASE_URL ? 
            process.env.DATABASE_URL.replace(/(:.*@)/g, ':****@') : 
            '未设置 DATABASE_URL 环境变量'}
        </pre>
      </div>
    </div>
  )
} matcher: ["/((?!auth|api|_next/static|_next/image|favicon.ico).*)"],
}
```

### 8. 监控和维护

1. 设置 Vercel Analytics
2. 配置错误监控（可选择 Sentry）
3. 设置数据库备份策略
4. 监控数据库性能
5. 使用 `lib/monitoring.ts` 中的 `captureError` 函数记录错误：
```typescript
export function captureError(error: Error) {
  // 添加错误监控逻辑
  console.error(error)
  
  // 可以集成 Sentry 等服务
}
```

## English Version

### 1. Environment Setup

#### 1.1 Local Environment
1. Ensure Node.js (v20+) is installed
2. Install pnpm:
```bash
npm install -g pnpm
```

#### 1.2 Supabase Setup
1. Create Supabase account and new project
2. Get from Supabase console:
   - Database URL
   - Anon Key
   - Service Role Key
3. Run initialization script in SQL editor:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### 1.3 Environment Variables
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in required environment variables:
```
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Auth
AUTH_SECRET="generate a random string"
AUTH_GOOGLE_ID="from Google Cloud Console"
AUTH_GOOGLE_SECRET="from Google Cloud Console"
# ... other auth providers config ...

# Storage
AUTH_KV_REST_API_URL="from Vercel KV"
AUTH_KV_REST_API_TOKEN="from Vercel KV"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY="from Google Cloud Console"

# Other
NEXT_PUBLIC_APP_URL="your app domain"
AUTH_DEBUG="1"  # Set to 1 for development, remove for production
```

### 2. Database Migration

1. Generate Prisma client:
```bash
pnpm prisma generate
```

2. Push database schema:
```bash
pnpm prisma db push
```

3. Create migration files if needed:
```bash
pnpm prisma migrate dev --name init
```

### 3. Testing

1. Run tests:
```bash
pnpm test
```

2. Check test coverage:
```bash
pnpm test:coverage
```

### 4. Vercel Deployment

1. Install Vercel CLI:
```bash
pnpm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link project:
```bash
vercel link
```

4. Configure Vercel environment variables:
```bash
vercel env pull .env.production
```

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

```