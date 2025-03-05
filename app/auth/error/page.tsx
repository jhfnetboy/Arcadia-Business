'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// 错误内容组件
function ErrorContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    setError(errorParam)
    
    // 记录错误信息到控制台，便于调试
    console.error('Auth error:', errorParam)
  }, [searchParams])

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold text-red-600">认证错误</h1>
      
      <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">错误信息:</p>
        <p>{error || '未知错误'}</p>
      </div>
      
      <div className="mb-4 text-gray-700">
        <p className="mb-2">可能的原因:</p>
        <ul className="list-inside list-disc">
          <li>服务器配置问题</li>
          <li>认证提供商设置不正确</li>
          <li>环境变量缺失或不正确</li>
          <li>回调URL配置错误</li>
        </ul>
      </div>
      
      <div className="mt-6 flex justify-between">
        <Link 
          href="/"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          返回首页
        </Link>
        <Link 
          href="/auth/signin"
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          重试登录
        </Link>
      </div>
    </div>
  )
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">加载中...</h1>
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    </div>
  )
}

// 主页面组件
export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<LoadingState />}>
        <ErrorContent />
      </Suspense>
    </div>
  )
} 