import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logDatabaseUrl } from '@/lib/utils'

export async function GET() {
  const startTime = Date.now();
  let prisma: PrismaClient | null = null;

  try {
    // 记录数据库 URL（已屏蔽敏感信息）
    logDatabaseUrl(process.env.DATABASE_URL || '', 'Using DATABASE_URL')

    // 创建 Prisma 客户端实例
    prisma = new PrismaClient()

    // 测试连接
    await prisma.$connect();
    console.log('Database connection established');
    
    // 计算执行时间
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      executionTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    // 断开数据库连接
    if (prisma) {
      await prisma.$disconnect();
    }
  }
} 