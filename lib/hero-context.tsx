'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// 英雄类型定义
export interface Hero {
  name: string
  points: number
  level: number
  userId: string
  createdAt: string
  tokenId?: string
  txHash?: string
  network?: string
}

// 上下文类型定义
interface HeroContextType {
  hero: Hero | null
  setHero: (hero: Hero | null) => void
}

// 创建上下文
const HeroContext = createContext<HeroContextType | undefined>(undefined)

// 上下文提供者属性类型
interface HeroProviderProps {
  children: ReactNode
}

// 上下文提供者组件
export function HeroProvider({ children }: HeroProviderProps) {
  const [hero, setHero] = useState<Hero | null>(null)
  
  return (
    <HeroContext.Provider value={{ hero, setHero }}>
      {children}
    </HeroContext.Provider>
  )
}

// 自定义钩子，用于访问上下文
export function useHero() {
  const context = useContext(HeroContext)
  
  if (context === undefined) {
    throw new Error('useHero must be used within a HeroProvider')
  }
  
  return context
} 