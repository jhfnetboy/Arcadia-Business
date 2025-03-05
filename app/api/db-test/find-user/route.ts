import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// 创建一个新的 Prisma 客户端实例，专门用于测试
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
})

export async function GET() {
  console.log('查询用户 API 被调用')

  try {
    // 查询最多5个用户
    const startTime = Date.now()
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // 不包含敏感信息
      }
    })
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`成功查询到 ${users.length} 个用户，查询耗时: ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      message: `成功查询到 ${users.length} 个用户，查询耗时: ${duration}ms`,
      data: {
        users,
        count: users.length,
        duration,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('查询用户失败:', error)
    
    return NextResponse.json({
      success: false,
      message: `查询用户失败: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  } finally {
    // 确保在测试完成后断开连接
    await prisma.$disconnect()
  }
} 