import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 添加调试信息，输出数据库连接 URL
console.log("DATABASE_URL from env:", process.env.DATABASE_URL)

// 创建 Prisma 客户端实例，显式指定数据库 URL 和连接超时
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn', 'info'],
  // 增加连接超时设置
  // @ts-ignore - Prisma 类型定义中可能没有包含这些高级选项
  __internal: {
    engine: {
      connectionTimeout: 10000, // 10 秒连接超时
      queryEngineTimeout: 10000, // 10 秒查询超时
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 错误处理辅助函数
const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || ''
    };
  }
  return {
    name: 'Unknown Error',
    message: String(error),
    stack: ''
  };
};

/**
 * 测试数据库连接
 * 尝试执行一个简单的查询来验证连接是否正常
 */
export async function testConnection() {
  console.log("测试数据库连接，URL:", process.env.DATABASE_URL)
  
  try {
    // 尝试执行一个简单的查询
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log("数据库连接成功:", result)
    return { success: true, result }
  } catch (error) {
    console.error("数据库连接失败:", error)
    const errorDetails = getErrorDetails(error);
    return { 
      success: false, 
      error: errorDetails
    }
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
  
  // 安全地显示数据库 URL（隐藏密码）
  const safeDbUrl = dbUrl ? 
    `${dbUrl.split('@')[0].split(':')[0]}:****@${dbUrl.split('@')[1]}` : 
    'undefined';
  
  console.log(`创建新的 Prisma 客户端，URL: ${safeDbUrl}`);
  
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