import { NextResponse, NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户会话
    const session = await auth()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 解析请求体
    const heroData = await request.json()
    
    // 验证必要字段
    if (!heroData.name) {
      return NextResponse.json(
        { success: false, error: 'Hero name is required' },
        { status: 400 }
      )
    }
    
    // 检查是否已存在同名英雄
    const existingHero = await prisma.heroData.findFirst({
      where: {
        userId: session.user.email,
        name: heroData.name
      }
    })
    
    let hero;
    
    if (existingHero) {
      // 更新现有英雄数据
      hero = await prisma.heroData.update({
        where: {
          id: existingHero.id
        },
        data: {
          points: heroData.points || existingHero.points,
          level: heroData.level || existingHero.level,
          metadata: heroData.metadata || existingHero.metadata,
          updatedAt: new Date()
        }
      })
    } else {
      // 创建新英雄
      hero = await prisma.heroData.create({
        data: {
          userId: session.user.email,
          name: heroData.name,
          points: heroData.points || 0,
          level: heroData.level || 1,
          metadata: heroData.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
    return NextResponse.json(
      { success: true, hero },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Error saving hero data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save hero data' },
      { status: 500 }
    )
  }
} 