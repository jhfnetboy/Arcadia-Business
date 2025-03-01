import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from "auth"; // 确保这是正确的导入路径

// 定义中间件函数
export function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  // 记录请求处理时间
  const duration = Date.now() - start
  console.log(`${request.method} ${request.url} - ${duration}ms`)
  
  return response
}

// 如果你需要使用 auth 中间件，可以将其作为默认导出
export default auth; // 这里使用默认导出

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!auth|api|_next/static|_next/image|favicon.ico).*)"],
}
