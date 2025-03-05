import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
  console.log('Prisma 直接查询测试 API 被调用')
  
  // 获取数据库 URL
  const dbUrl = process.env.DATABASE_URL
  console.log('原始 DATABASE_URL:', dbUrl)
  
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, message: '未设置 DATABASE_URL 环境变量' },
      { status: 400 }
    )
  }

  try {
    // 修改数据库 URL，禁用 SSL 证书验证
    let modifiedDbUrl = dbUrl;
    if (modifiedDbUrl.includes('sslmode=require')) {
      modifiedDbUrl = modifiedDbUrl.replace(/sslmode=require/g, 'sslmode=prefer');
    } else if (!modifiedDbUrl.includes('sslmode=')) {
      modifiedDbUrl = `${modifiedDbUrl}${modifiedDbUrl.includes('?') ? '&' : '?'}sslmode=prefer`;
    }
    
    // 设置环境变量，禁用 SSL 证书验证
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // 创建一个新的 Prisma 客户端实例
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: modifiedDbUrl,
        },
      },
      log: ['query', 'error', 'warn', 'info'],
    })

    // 尝试直接执行 SQL 查询
    const startTime = Date.now()
    
    // 使用 $queryRawUnsafe 直接执行 SQL 查询
    const result = await prisma.$queryRawUnsafe('SELECT 1 as connected')
    console.log('查询结果:', result)
    
    // 断开连接
    await prisma.$disconnect()
    
    // 恢复环境变量
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'Prisma 直接查询成功',
      data: result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Prisma 直接查询失败:', error)
    
    // 恢复环境变量
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    
    const errorDetails = getErrorDetails(error);
    
    return NextResponse.json({
      success: false,
      message: `Prisma 直接查询失败: ${errorDetails.message}`,
      errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 