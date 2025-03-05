import { NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import dns from 'node:dns'

const execPromise = promisify(exec)

export async function GET() {
  console.log('测试网络连接 API 被调用')
  
  try {
    const dbUrl = process.env.DATABASE_URL || ''
    console.log('DATABASE_URL:', dbUrl)
    
    // 解析数据库主机名
    let hostname = ''
    try {
      const url = new URL(dbUrl)
      hostname = url.hostname
    } catch (error) {
      console.error('解析数据库 URL 失败:', error)
      hostname = 'aws-0-ap-southeast-1.pooler.supabase.com'
    }
    
    console.log('数据库主机名:', hostname)
    
    // 测试 DNS 解析
    let dnsResult: string | unknown
    try {
      dnsResult = await new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address) => {
          if (err) reject(err)
          else resolve(address)
        })
      })
    } catch (error) {
      console.error('DNS 解析失败:', error)
      dnsResult = `DNS 解析失败: ${error instanceof Error ? error.message : String(error)}`
    }
    
    // 测试 TCP 连接
    let tcpResult: string | unknown
    try {
      const { stdout, stderr } = await execPromise(`nc -zv ${hostname} 5432 2>&1 || echo "连接失败"`)
      tcpResult = stdout || stderr
    } catch (error) {
      console.error('TCP 连接测试失败:', error)
      tcpResult = `TCP 连接测试失败: ${error instanceof Error ? error.message : String(error)}`
    }
    
    // 测试 TLS 连接
    let tlsResult: string | unknown
    try {
      const { stdout, stderr } = await execPromise(`openssl s_client -connect ${hostname}:5432 -tls1_2 -servername ${hostname} 2>&1 < /dev/null | grep "Verify return code" || echo "TLS 连接失败"`)
      tlsResult = stdout || stderr
    } catch (error) {
      console.error('TLS 连接测试失败:', error)
      tlsResult = `TLS 连接测试失败: ${error instanceof Error ? error.message : String(error)}`
    }
    
    return NextResponse.json({
      success: true,
      message: '网络连接测试完成',
      data: {
        hostname,
        dnsResult,
        tcpResult,
        tlsResult,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('网络连接测试失败:', error)
    
    return NextResponse.json({
      success: false,
      message: `网络连接测试失败: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        errorDetails: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
} 