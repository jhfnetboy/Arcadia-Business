"use client"

import { useEffect } from "react"

export default function HtmlCleanup() {
  useEffect(() => {
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
    const allElements = document.querySelectorAll('*[data-theme], *[data-color-mode]')
    allElements.forEach(el => {
      el.removeAttribute('data-theme')
      el.removeAttribute('data-color-mode')
    })
  }, [])

  return null
} 