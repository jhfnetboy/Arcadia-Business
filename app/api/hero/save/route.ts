import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取请求数据
    const heroData = await request.json()

    // 验证数据
    if (!heroData || !heroData.name) {
      return NextResponse.json(
        { success: false, message: 'Invalid hero data' },
        { status: 400 }
      )
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // 查找现有的英雄数据
    const existingHero = await prisma.heroData.findFirst({
      where: {
        userId: user.id,
        name: heroData.name,
      },
    })

    let hero

    if (existingHero) {
      // 更新现有英雄数据
      hero = await prisma.heroData.update({
        where: { id: existingHero.id },
        data: {
          points: heroData.points || existingHero.points,
          level: heroData.level || existingHero.level,
          metadata: {
            ...(existingHero.metadata as any || {}),
            lastUpdated: new Date().toISOString(),
          },
        },
      })
    } else {
      // 创建新的英雄数据
      hero = await prisma.heroData.create({
        data: {
          userId: user.id,
          name: heroData.name,
          points: heroData.points || 0,
          level: heroData.level || 1,
          metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        },
      })
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: 'Hero data saved successfully',
      hero,
    })
  } catch (error) {
    console.error('Error saving hero data:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 