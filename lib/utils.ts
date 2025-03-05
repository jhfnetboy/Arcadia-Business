import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePasscode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 安全地记录数据库URL，隐藏敏感信息
 * @param url 数据库URL
 * @param showInProduction 是否在生产环境中显示（默认为false）
 * @returns 处理后的安全URL字符串
 */
export const maskDatabaseUrl = (url: string): string => {
  if (!url) return 'URL未设置';
  
  try {
    const parsedUrl = new URL(url);
    // 隐藏密码
    if (parsedUrl.password) {
      parsedUrl.password = '********';
    }
    return parsedUrl.toString();
  } catch (e) {
    // 如果URL格式无效，使用正则表达式处理
    return url.replace(/\/\/[^:]+:([^@]+)@/, '//[username]:[masked-password]@');
  }
};

/**
 * 安全地记录数据库URL到控制台
 * 只在非生产环境中记录
 * @param url 数据库URL
 * @param label 日志标签
 */
export const logDatabaseUrl = (url: string, label = 'DATABASE_URL'): void => {
  // 在生产环境中不记录数据库URL
  if (process.env.NODE_ENV === 'production') return;
  
  const maskedUrl = maskDatabaseUrl(url);
  console.log(`${label} (masked): ${maskedUrl}`);
};

/**
 * 从未知错误中提取错误详情
 * @param error 未知类型的错误
 * @returns 格式化的错误详情
 */
export const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || 'No stack trace available'
    };
  }
  return {
    name: 'Unknown Error',
    message: String(error),
    stack: 'No stack trace available'
  };
};
