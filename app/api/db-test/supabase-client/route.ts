import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  console.log('Supabase 客户端测试 API 被调用')
  
  // 从数据库 URL 中提取 Supabase URL 和密钥
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, message: '未设置 DATABASE_URL 环境变量' },
      { status: 400 }
    )
  }

  try {
    // 从数据库 URL 中提取主机名
    const urlMatch = dbUrl.match(/@([^:]+)/)
    if (!urlMatch) {
      return NextResponse.json(
        { success: false, message: '无法从数据库 URL 中提取主机名' },
        { status: 400 }
      )
    }

    const hostname = urlMatch[1]
    // 提取用户名和密码
    const authMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@/)
    if (!authMatch) {
      return NextResponse.json(
        { success: false, message: '无法从数据库 URL 中提取认证信息' },
        { status: 400 }
      )
    }

    const username = authMatch[1]
    const password = authMatch[2]

    // 构建 Supabase URL 和密钥
    const supabaseUrl = `https://${hostname.split('.')[0]}.supabase.co`
    const supabaseKey = password // 使用密码作为 API 密钥

    console.log(`尝试连接到 Supabase: ${supabaseUrl}`)

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // 测试连接 - 使用更简单的 API 调用
    const startTime = Date.now()
    
    // 尝试获取服务器时间，这是一个简单的 API 调用
    const { data, error } = await supabase.rpc('get_service_status')
    
    if (error) {
      throw new Error(`Supabase API 错误: ${error.message || JSON.stringify(error)}`)
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Supabase 客户端连接成功',
      data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Supabase 客户端连接失败:', error)

    const errorDetails = getErrorDetails(error);

    return NextResponse.json({
      success: false,
      message: `Supabase 客户端连接失败: ${errorDetails.message}`,
      errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 