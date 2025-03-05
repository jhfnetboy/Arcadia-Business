import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取所有查询参数
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get('callbackUrl');
  
  // 记录登出请求信息
  console.log('Sign out request received at API route');
  console.log('Callback URL:', callbackUrl);
  
  // 重定向到正确的登出页面
  const redirectUrl = new URL('/auth/signout', request.nextUrl.origin);
  
  // 保留回调 URL 参数
  if (callbackUrl) {
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
  }
  
  return NextResponse.redirect(redirectUrl);
} 