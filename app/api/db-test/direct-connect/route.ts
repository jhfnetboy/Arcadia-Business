import { NextResponse } from 'next/server'
import { Client } from 'pg'

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
  console.log('直接连接测试 API 被调用')
  
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
    const startTime = Date.now()
    
    // 创建客户端，禁用 SSL 证书验证
    const client = new Client({
      connectionString: dbUrl,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      ssl: {
        rejectUnauthorized: false // 禁用证书验证，接受自签名证书
      }
    })

    // 尝试连接
    await client.connect()
    console.log('连接成功')
    
    // 执行简单查询
    const result = await client.query('SELECT 1 as connected')
    console.log('查询结果:', result.rows[0])
    
    // 关闭连接
    await client.end()
    
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: '直接连接 Supabase 成功',
      data: result.rows[0],
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('直接连接 Supabase 失败:', error)
    
    const errorDetails = getErrorDetails(error);
    
    return NextResponse.json({
      success: false,
      message: `直接连接 Supabase 失败: ${errorDetails.message}`,
      errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 