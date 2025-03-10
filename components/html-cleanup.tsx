"use client"

import { useEffect, useState } from "react"

export default function HtmlCleanup() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 标记组件已挂载
    setMounted(true)

    // 移除 html 标签上的属性
    const html = document.documentElement
    html.removeAttribute("data-theme")
    html.removeAttribute("style")
    
    // 移除 body 上的 Chakra UI 类
    document.body.classList.remove("chakra-ui-light", "chakra-ui-dark")
    
    // 移除可能存在的 Chakra UI 相关的 style 标签
    const chakraStyles = document.querySelectorAll('style[data-emotion]')
    chakraStyles.forEach(style => style.remove())
    
    // 移除可能存在的其他主题相关的属性
    const allElements = document.querySelectorAll('*[data-theme], *[data-color-mode], *[style*="color-scheme"]')
    allElements.forEach(el => {
      el.removeAttribute('data-theme')
      el.removeAttribute('data-color-mode')
      if (el.getAttribute('style')?.includes('color-scheme')) {
        const style = el.getAttribute('style') || ''
        el.setAttribute('style', style.replace(/color-scheme:[^;]+;?/g, ''))
      }
    })

    // 移除 color-scheme meta 标签
    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
    if (colorSchemeMeta) {
      colorSchemeMeta.remove()
    }
  }, [])

  // 如果组件尚未挂载，返回 null
  if (!mounted) return null

  return null
} 