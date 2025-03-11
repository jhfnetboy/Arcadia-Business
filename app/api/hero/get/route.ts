import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 获取当前用户会话
    const session = await auth()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 从数据库获取用户的英雄数据
    const hero = await prisma.heroData.findFirst({
      where: {
        userId: session.user.email
      }
    })
    
    if (!hero) {
      return NextResponse.json(
        { success: false, hero: null, message: 'No hero found' },
        { status: 200 }
      )
    }
    
    return NextResponse.json(
      { success: true, hero },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Error fetching hero:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero data' },
      { status: 500 }
    )
  }
} 