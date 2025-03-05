import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 添加调试信息，输出数据库连接 URL
console.log("DATABASE_URL from env:", process.env.DATABASE_URL)

// 创建 Prisma 客户端实例，显式指定数据库 URL
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma 

// 测试数据库连接
export async function testConnection() {
  try {
    // 尝试执行一个简单查询
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("Database connection test result:", result)
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
} 