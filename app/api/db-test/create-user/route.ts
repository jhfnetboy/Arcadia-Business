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

export async function POST(request: Request) {
  console.log('创建用户 API 被调用')

  try {
    // 解析请求体
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数: email',
      }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: `用户已存在: ${email}`,
        data: {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          }
        }
      }, { status: 409 })
    }

    // 创建新用户
    const startTime = Date.now()
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || `测试用户 ${new Date().toLocaleString('zh-CN')}`,
      }
    })
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log('成功创建用户:', newUser)
    
    return NextResponse.json({
      success: true,
      message: `成功创建用户: ${newUser.email}，创建耗时: ${duration}ms`,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt,
        },
        duration,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    
    return NextResponse.json({
      success: false,
      message: `创建用户失败: ${error instanceof Error ? error.message : String(error)}`,
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