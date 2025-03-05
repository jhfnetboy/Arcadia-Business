import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

export async function GET() {
  console.log('测试数据库连接 API 被调用')
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  
  try {
    // 尝试执行一个简单的查询来测试连接
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    
    return NextResponse.json({
      success: true,
      message: '成功连接到数据库',
      data: {
        result,
        databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL || ''),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    
    return NextResponse.json({
      success: false,
      message: `无法连接到数据库: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        databaseUrl: maskDatabaseUrl(process.env.DATABASE_URL || ''),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

// 隐藏数据库 URL 中的敏感信息
function maskDatabaseUrl(url: string): string {
  if (!url) return '未设置'
  
  try {
    // 如果不是 PostgreSQL URL，直接返回"已设置但不显示"
    if (!url.startsWith('postgresql://')) {
      return '已设置但不显示'
    }
    
    // 解析 URL 并隐藏密码
    const parts = url.split('@')
    if (parts.length !== 2) return '已设置但格式不标准'
    
    const credentials = parts[0].split(':')
    if (credentials.length < 3) return '已设置但格式不标准'
    
    // 隐藏密码部分
    const protocol = credentials[0]
    const username = credentials[1].replace('//', '')
    const host = parts[1]
    
    return `${protocol}://${username}:****@${host}`
  } catch (error) {
    return '已设置但无法解析'
  }
}
