import { NextResponse } from 'next/server'
import { Client } from 'pg'

// 定义结果类型
type ConnectionResult = {
  option: string;
  success: boolean;
  message: string;
  duration?: string;
  data?: unknown;
  errorDetails?: {
    name: string;
    message: string;
    stack: string;
  };
}

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
  console.log('Supabase 连接测试 API 被调用')
  
  // 获取原始数据库 URL
  const originalDbUrl = process.env.DATABASE_URL
  console.log('原始 DATABASE_URL:', originalDbUrl)
  
  if (!originalDbUrl) {
    return NextResponse.json(
      { success: false, message: '未设置 DATABASE_URL 环境变量' },
      { status: 400 }
    )
  }

  // 尝试不同的连接选项
  const connectionOptions = [
    {
      name: '禁用 SSL 证书验证',
      url: originalDbUrl,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: '原始连接字符串',
      url: originalDbUrl,
      ssl: true
    },
    {
      name: '不使用 SSL',
      url: originalDbUrl.replace(/\?sslmode=require(&.*)?$/, ''),
      ssl: false
    },
    {
      name: '不使用 URL 编码',
      url: originalDbUrl.replace(/%2A/g, '*').replace(/%24/g, '$'),
      ssl: { rejectUnauthorized: false }
    }
  ]

  // 初始化结果数组，明确指定类型
  const results: ConnectionResult[] = []

  // 测试每个连接选项
  for (const option of connectionOptions) {
    console.log(`尝试连接选项: ${option.name}`)
    
    try {
      const startTime = Date.now()
      
      // 创建客户端
      const client = new Client({
        connectionString: option.url,
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        ssl: option.ssl
      })

      // 尝试连接
      await client.connect()
      console.log(`连接成功: ${option.name}`)
      
      // 执行简单查询
      const result = await client.query('SELECT 1 as connected')
      console.log(`查询结果:`, result.rows[0])
      
      // 关闭连接
      await client.end()
      
      const duration = Date.now() - startTime
      
      results.push({
        option: option.name,
        success: true,
        message: '连接成功',
        duration: `${duration}ms`,
        data: result.rows[0]
      })
    } catch (error) {
      console.error(`连接失败: ${option.name}`, error)
      
      const errorDetails = getErrorDetails(error);
      
      results.push({
        option: option.name,
        success: false,
        message: `连接失败: ${errorDetails.message}`,
        errorDetails
      })
    }
  }

  // 返回所有测试结果
  return NextResponse.json({
    success: results.some(r => r.success),
    message: results.some(r => r.success) 
      ? '至少有一个连接选项成功' 
      : '所有连接选项都失败',
    results,
    timestamp: new Date().toISOString()
  })
} 