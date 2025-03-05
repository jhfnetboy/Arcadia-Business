'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// 错误内容组件
function ErrorContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})

  useEffect(() => {
    // 获取URL中的错误参数
    const errorParam = searchParams.get('error')
    setError(errorParam)
    
    // 获取错误类型
    const errorTypeParam = searchParams.get('error_type') || 'unknown'
    setErrorType(errorTypeParam)
    
    // 收集调试信息
    const debug: Record<string, any> = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      cookies: document.cookie ? '已设置' : '未设置',
      localStorage: window.localStorage ? '可用' : '不可用',
    }
    
    // 检查环境变量（仅检查是否存在，不显示值）
    if (typeof window !== 'undefined') {
      debug.origin = window.location.origin
      debug.host = window.location.host
      debug.pathname = window.location.pathname
      debug.search = window.location.search
    }
    
    setDebugInfo(debug)
    
    // 记录错误信息到控制台，便于调试
    console.error('Auth error:', errorParam)
    console.error('Error type:', errorTypeParam)
    console.error('Debug info:', debug)
  }, [searchParams])

  // 获取错误原因的详细说明
  const getErrorExplanation = (errorType: string | null, errorMsg: string | null) => {
    if (!errorType && !errorMsg) return '未知错误，无法确定具体原因。'
    
    const explanations: Record<string, string> = {
      'configuration': '认证系统配置错误，可能是环境变量或提供商设置有误。',
      'accessdenied': '访问被拒绝，您可能没有权限访问此资源或账户被禁用。',
      'verification': '验证失败，可能是令牌无效或已过期。',
      'callback': '回调处理错误，可能是回调URL配置错误或认证流程中断。',
      'oauthsignin': 'OAuth登录过程中出错，可能是提供商配置问题。',
      'oauthcallback': 'OAuth回调过程中出错，可能是回调URL不匹配或状态验证失败。',
      'oauthcreateaccount': '创建OAuth账户时出错，可能是用户信息不完整。',
      'emailcreateaccount': '创建邮箱账户时出错，可能是邮箱已被使用。',
      'emailsignin': '邮箱登录过程中出错，可能是邮箱格式不正确。',
      'credentialssignin': '凭证登录失败，可能是用户名或密码错误。',
      'sessionrequired': '需要会话，您可能需要先登录。',
      'default': '发生未知错误，请稍后重试或联系管理员。'
    }
    
    // 如果有具体错误消息，优先使用
    if (errorMsg && errorMsg !== 'null') {
      return errorMsg
    }
    
    // 否则根据错误类型返回通用说明
    return explanations[errorType || 'default'] || explanations.default
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold text-red-600">认证错误</h1>
      
      <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
        <p className="font-medium">错误信息:</p>
        <p>{getErrorExplanation(errorType, error)}</p>
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
      
      <div className="mb-4">
        <details className="cursor-pointer rounded border border-gray-200 p-2">
          <summary className="font-medium text-gray-600">调试信息 (点击展开)</summary>
          <div className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </details>
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