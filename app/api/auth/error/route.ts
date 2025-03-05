import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 获取错误参数
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get('error');
  
  // 记录错误信息
  console.log('Auth error received at API route:', error);
  
  // 重定向到错误页面
  const redirectUrl = new URL('/auth/error', request.nextUrl.origin);
  
  // 保留错误参数
  if (error) {
    redirectUrl.searchParams.set('error', error);
  }
  
  return NextResponse.redirect(redirectUrl);
}