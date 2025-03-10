"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function useTheme() {
  return useContext(ThemeProviderContext)
}

export default function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  // 只在客户端渲染后执行
  useEffect(() => {
    setMounted(true)
    
    // 移除可能存在的 chakra-ui 类
    document.body.classList.remove("chakra-ui-light", "chakra-ui-dark")
    
    // 设置当前主题
    const root = window.document.documentElement
    root.removeAttribute("data-theme")
    root.removeAttribute("style")
  }, [])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  // 在服务器端渲染和客户端首次渲染时返回相同的内容
  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
} 