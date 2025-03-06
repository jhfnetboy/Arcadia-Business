import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logDatabaseUrl } from '@/lib/utils'

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

export async function GET() {
  const startTime = Date.now()
  let prisma: PrismaClient | null = null

  try {
    // 记录数据库 URL（已屏蔽敏感信息）
    logDatabaseUrl(process.env.DATABASE_URL || '', 'Using DATABASE_URL')

    // 创建 Prisma 客户端实例
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'error', 'warn', 'info'],
    })

    // 执行测试查询
    const result = await prisma.$queryRaw`SELECT NOW()`
    
    // 计算执行时间
    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: result,
      executionTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  } finally {
    // 断开数据库连接
    if (prisma) {
      await prisma.$disconnect()
    }
  }
} 