import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('获取数据库连接信息 API 被调用')
  const dbUrl = process.env.DATABASE_URL || ''
  console.log('DATABASE_URL:', dbUrl)
  
  try {
    // 返回成功响应，不执行数据库查询
    return NextResponse.json({
      success: true,
      message: '成功获取数据库连接信息',
      data: {
        dbUrl: dbUrl ? maskDatabaseUrl(dbUrl) : '未设置 DATABASE_URL 环境变量'
      }
    })
  } catch (error) {
    console.error('Error fetching DB info:', error)
    
    // 返回错误响应
    return NextResponse.json({
      success: false,
      message: '获取数据库连接信息时出错',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 隐藏数据库 URL 中的敏感信息
function maskDatabaseUrl(url: string): string {
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