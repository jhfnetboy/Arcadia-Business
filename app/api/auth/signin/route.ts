import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取回调 URL 参数
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get('callbackUrl');
  
  // 记录登录请求信息
  console.log('Sign in request received at API route, redirecting to /auth/signin');
  console.log('Callback URL:', callbackUrl);
  
  // 重定向到正确的登录页面
  const redirectUrl = new URL('/auth/signin', request.nextUrl.origin);
  
  // 保留回调 URL 参数
  if (callbackUrl) {
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
  }
  
  return NextResponse.redirect(redirectUrl);
} 