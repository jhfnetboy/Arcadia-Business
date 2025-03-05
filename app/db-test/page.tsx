'use client'

import { useState, useEffect } from 'react'
import { Info, CheckCircle, XCircle, Database, User, UserPlus } from 'lucide-react'

// 定义响应类型
type TestResponse = {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export default function DbTestPage() {
  // 状态管理
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    connection: false,
    findUser: false,
    createUser: false
  })
  const [results, setResults] = useState<{[key: string]: TestResponse | null}>({
    connection: null,
    findUser: null,
    createUser: null
  })
  const [dbUrl, setDbUrl] = useState<string>('加载中...')

  // 获取数据库连接信息
  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await fetch('/api/db-test/db-info')
        const data = await response.json()
        if (data.success) {
          setDbUrl(data.data.dbUrl || '未设置 DATABASE_URL 环境变量')
        } else {
          setDbUrl('无法获取数据库连接信息')
        }
      } catch (error) {
        setDbUrl('获取数据库连接信息时出错')
        console.error('Error fetching DB info:', error)
      }
    }
    
    fetchDbInfo()
  }, [])

  // 测试数据库连接
  const testConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }))
    try {
      const response = await fetch('/api/db-test/connection')
      const data = await response.json()
      setResults(prev => ({ ...prev, connection: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        connection: { 
          success: false, 
          message: `测试连接失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, connection: false }))
    }
  }

  // 查询用户
  const findUser = async () => {
    setLoading(prev => ({ ...prev, findUser: true }))
    try {
      const response = await fetch('/api/db-test/find-user')
      const data = await response.json()
      setResults(prev => ({ ...prev, findUser: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        findUser: { 
          success: false, 
          message: `查询用户失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, findUser: false }))
    }
  }

  // 创建用户
  const createUser = async () => {
    setLoading(prev => ({ ...prev, createUser: true }))
    try {
      const response = await fetch('/api/db-test/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test-user-${Date.now()}@example.com`,
          name: `测试用户 ${new Date().toLocaleString('zh-CN')}`
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, createUser: data }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        createUser: { 
          success: false, 
          message: `创建用户失败：${error instanceof Error ? error.message : String(error)}` 
        } 
      }))
    } finally {
      setLoading(prev => ({ ...prev, createUser: false }))
    }
  }

  // 渲染测试结果
  const renderResult = (result: TestResponse | null) => {
    if (!result) return null

    return (
      <div className={`mt-4 p-3 rounded-md ${
        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center">
          {result.success 
            ? <CheckCircle className="text-green-500 mr-2" /> 
            : <XCircle className="text-red-500 mr-2" />}
          <span className={result.success ? 'text-green-700' : 'text-red-700'}>
            {result.message}
          </span>
        </div>
        {result.data && (
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">数据库连接测试</h1>
      
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <Info className="mr-2" /> 数据库连接信息
        </h2>
        <p className="mb-2">
          <strong>数据库 URL:</strong> {dbUrl.startsWith('postgres') 
            ? `${dbUrl.split('@')[0].split(':')[0]}:****@${dbUrl.split('@')[1]}` 
            : dbUrl}
        </p>
        
        <div className="mt-4">
          <button 
            onClick={testConnection}
            disabled={loading.connection}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.connection ? '测试中...' : '测试连接'}
          </button>
        </div>
        
        {renderResult(results.connection)}
      </div>
      
      <div className="grid gap-6">
        {/* 查询用户 */}
        <div className="col-span-2">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <User className="mr-2" /> 查询用户
          </h2>
          <p className="text-muted-foreground mb-2">
            尝试从数据库中查询用户列表
          </p>
          <div className="mt-4">
            <button 
              onClick={findUser}
              disabled={loading.findUser}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              {loading.findUser ? '查询中...' : '查询用户'}
            </button>
          </div>
          {renderResult(results.findUser)}
        </div>

        {/* 创建用户 */}
        <div className="col-span-2">
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <UserPlus className="mr-2" /> 创建用户
          </h2>
          <p className="text-muted-foreground mb-2">
            尝试在数据库中创建一个新用户
          </p>
          <div className="mt-4">
            <button 
              onClick={createUser}
              disabled={loading.createUser}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              {loading.createUser ? '创建中...' : '创建用户'}
            </button>
          </div>
          {renderResult(results.createUser)}
        </div>
      </div>
    </div>
  )
} 