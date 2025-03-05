'use client'

import { useState, useEffect } from 'react'
import { Info, CheckCircle, XCircle, Database, User, UserPlus, Network, Link } from 'lucide-react'

// 定义响应类型
type TestResponse = {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

// 错误处理辅助函数
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function DbTestPage() {
  // 状态管理
  const [loading, setLoading] = useState<{[key: string]: boolean}>({
    connection: false,
    findUser: false,
    createUser: false,
    network: false,
    directConnect: false,
    supabaseConnect: false,
    prismaConnect: false,
    supabaseClient: false,
    prismaDirect: false
  })
  const [results, setResults] = useState<{[key: string]: TestResponse | null}>({
    connection: null,
    findUser: null,
    createUser: null,
    network: null,
    directConnect: null,
    supabaseConnect: null,
    prismaConnect: null,
    supabaseClient: null,
    prismaDirect: null
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
          setDbUrl('获取数据库信息失败')
        }
      } catch (error) {
        console.error('获取数据库信息出错:', error)
        setDbUrl('获取数据库信息出错')
      }
    }

    fetchDbInfo()
  }, [])

  // 测试数据库连接
  const testConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }))
    setResults(prev => ({ ...prev, connection: null }))

    try {
      const response = await fetch('/api/db-test/connection')
      const data = await response.json()
      setResults(prev => ({ ...prev, connection: data }))
    } catch (error) {
      console.error('测试连接出错:', error)
      setResults(prev => ({
        ...prev,
        connection: {
          success: false,
          message: `测试连接出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, connection: false }))
    }
  }

  // 测试网络连接
  const testNetwork = async () => {
    setLoading(prev => ({ ...prev, network: true }))
    setResults(prev => ({ ...prev, network: null }))

    try {
      const response = await fetch('/api/db-test/network')
      const data = await response.json()
      setResults(prev => ({ ...prev, network: data }))
    } catch (error) {
      console.error('测试网络出错:', error)
      setResults(prev => ({
        ...prev,
        network: {
          success: false,
          message: `测试网络出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, network: false }))
    }
  }

  // 直接连接测试
  const testDirectConnect = async () => {
    setLoading(prev => ({ ...prev, directConnect: true }))
    setResults(prev => ({ ...prev, directConnect: null }))

    try {
      const response = await fetch('/api/db-test/direct-connect')
      const data = await response.json()
      setResults(prev => ({ ...prev, directConnect: data }))
    } catch (error) {
      console.error('直接连接测试出错:', error)
      setResults(prev => ({
        ...prev,
        directConnect: {
          success: false,
          message: `直接连接测试出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, directConnect: false }))
    }
  }

  // Supabase 连接测试
  const testSupabaseConnect = async () => {
    setLoading(prev => ({ ...prev, supabaseConnect: true }))
    setResults(prev => ({ ...prev, supabaseConnect: null }))

    try {
      const response = await fetch('/api/db-test/supabase-connect')
      const data = await response.json()
      setResults(prev => ({ ...prev, supabaseConnect: data }))
    } catch (error) {
      console.error('Supabase 连接测试出错:', error)
      setResults(prev => ({
        ...prev,
        supabaseConnect: {
          success: false,
          message: `Supabase 连接测试出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, supabaseConnect: false }))
    }
  }

  // Prisma 连接测试
  const testPrismaConnect = async () => {
    setLoading(prev => ({ ...prev, prismaConnect: true }))
    setResults(prev => ({ ...prev, prismaConnect: null }))

    try {
      const response = await fetch('/api/db-test/prisma-connect')
      const data = await response.json()
      setResults(prev => ({ ...prev, prismaConnect: data }))
    } catch (error) {
      console.error('Prisma 连接测试出错:', error)
      setResults(prev => ({
        ...prev,
        prismaConnect: {
          success: false,
          message: `Prisma 连接测试出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, prismaConnect: false }))
    }
  }

  // Supabase 客户端测试
  const testSupabaseClient = async () => {
    setLoading(prev => ({ ...prev, supabaseClient: true }))
    setResults(prev => ({ ...prev, supabaseClient: null }))

    try {
      const response = await fetch('/api/db-test/supabase-client')
      const data = await response.json()
      setResults(prev => ({ ...prev, supabaseClient: data }))
    } catch (error) {
      console.error('Supabase 客户端测试出错:', error)
      setResults(prev => ({
        ...prev,
        supabaseClient: {
          success: false,
          message: `Supabase 客户端测试出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, supabaseClient: false }))
    }
  }

  // Prisma 直接查询测试
  const testPrismaDirect = async () => {
    setLoading(prev => ({ ...prev, prismaDirect: true }))
    setResults(prev => ({ ...prev, prismaDirect: null }))

    try {
      const response = await fetch('/api/db-test/prisma-direct')
      const data = await response.json()
      setResults(prev => ({ ...prev, prismaDirect: data }))
    } catch (error) {
      console.error('Prisma 直接查询测试出错:', error)
      setResults(prev => ({
        ...prev,
        prismaDirect: {
          success: false,
          message: `Prisma 直接查询测试出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, prismaDirect: false }))
    }
  }

  // 查找用户
  const findUser = async () => {
    setLoading(prev => ({ ...prev, findUser: true }))
    setResults(prev => ({ ...prev, findUser: null }))

    try {
      const response = await fetch('/api/db-test/find-user')
      const data = await response.json()
      setResults(prev => ({ ...prev, findUser: data }))
    } catch (error) {
      console.error('查询用户出错:', error)
      setResults(prev => ({
        ...prev,
        findUser: {
          success: false,
          message: `查询用户出错: ${getErrorMessage(error)}`
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, findUser: false }))
    }
  }

  // 创建用户
  const createUser = async () => {
    setLoading(prev => ({ ...prev, createUser: true }))
    setResults(prev => ({ ...prev, createUser: null }))

    try {
      const response = await fetch('/api/db-test/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `测试用户_${Date.now()}`,
          email: `test_${Date.now()}@example.com`
        })
      })
      const data = await response.json()
      setResults(prev => ({ ...prev, createUser: data }))
    } catch (error) {
      console.error('创建用户出错:', error)
      setResults(prev => ({
        ...prev,
        createUser: {
          success: false,
          message: `创建用户出错: ${getErrorMessage(error)}`
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
      <div className={`mt-2 p-3 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
        <div className="flex items-start">
          {result.success ? (
            <CheckCircle className="text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <XCircle className="text-red-500 mr-2 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.data && (
              <pre className="mt-2 text-xs bg-gray-800 text-white p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">数据库连接测试</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          <Info className="mr-2 text-blue-500" />
          <h2 className="text-lg font-semibold">数据库连接信息</h2>
        </div>
        <p className="text-sm break-all">
          <span className="font-semibold">数据库 URL: </span>
          {dbUrl}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <button
            onClick={testConnection}
            disabled={loading.connection}
            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Database className="mr-2" />
            {loading.connection ? '测试中...' : '测试连接 (Prisma)'}
          </button>
          {results.connection && renderResult(results.connection)}
        </div>

        <div>
          <button
            onClick={testNetwork}
            disabled={loading.network}
            className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Network className="mr-2" />
            {loading.network ? '测试中...' : '测试网络'}
          </button>
          {results.network && renderResult(results.network)}
        </div>

        <div>
          <button
            onClick={testDirectConnect}
            disabled={loading.directConnect}
            className="flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Link className="mr-2" />
            {loading.directConnect ? '测试中...' : '直接连接 (pg)'}
          </button>
          {results.directConnect && renderResult(results.directConnect)}
        </div>

        <div>
          <button
            onClick={testSupabaseConnect}
            disabled={loading.supabaseConnect}
            className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Database className="mr-2" />
            {loading.supabaseConnect ? '测试中...' : 'Supabase 连接测试'}
          </button>
          {results.supabaseConnect && renderResult(results.supabaseConnect)}
        </div>

        <div>
          <button
            onClick={testPrismaConnect}
            disabled={loading.prismaConnect}
            className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Database className="mr-2" />
            {loading.prismaConnect ? '测试中...' : 'Prisma 连接测试'}
          </button>
          {results.prismaConnect && renderResult(results.prismaConnect)}
        </div>

        <div>
          <button
            onClick={testSupabaseClient}
            disabled={loading.supabaseClient}
            className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Database className="mr-2" />
            {loading.supabaseClient ? '测试中...' : 'Supabase 客户端测试'}
          </button>
          {results.supabaseClient && renderResult(results.supabaseClient)}
        </div>

        <div>
          <button
            onClick={testPrismaDirect}
            disabled={loading.prismaDirect}
            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <Database className="mr-2" />
            {loading.prismaDirect ? '测试中...' : 'Prisma 直接查询测试'}
          </button>
          {results.prismaDirect && renderResult(results.prismaDirect)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <button
            onClick={findUser}
            disabled={loading.findUser}
            className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <User className="mr-2" />
            {loading.findUser ? '查询中...' : '查询用户'}
          </button>
          {results.findUser && renderResult(results.findUser)}
        </div>

        <div>
          <button
            onClick={createUser}
            disabled={loading.createUser}
            className="flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
            type="button"
          >
            <UserPlus className="mr-2" />
            {loading.createUser ? '创建中...' : '创建用户'}
          </button>
          {results.createUser && renderResult(results.createUser)}
        </div>
      </div>
    </div>
  )
} 