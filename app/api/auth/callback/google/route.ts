import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取所有查询参数
  const searchParams = request.nextUrl.searchParams;
  const searchParamsString = Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // 记录回调请求信息
  console.log('Google auth callback received');
  console.log('Search params:', searchParamsString);
  
  // 重定向到正确的回调路径
  const redirectUrl = new URL('/auth/callback/google', request.nextUrl.origin);
  
  // 添加所有查询参数
  if (searchParamsString) {
    redirectUrl.search = searchParamsString;
  }
  
  return NextResponse.redirect(redirectUrl);
} 