"use client"

import { useEffect } from "react"

export default function ChakraCleanup() {
  useEffect(() => {
    // 移除 Chakra UI 相关的类和属性
    document.body.classList.remove("chakra-ui-light", "chakra-ui-dark")
    
    const htmlElement = document.documentElement
    htmlElement.removeAttribute("data-theme")
    htmlElement.removeAttribute("style")
    
    // 移除可能存在的 Chakra UI 相关的 style 标签
    const chakraStyles = document.querySelectorAll('style[data-emotion]')
    chakraStyles.forEach(style => style.remove())
  }, [])

  return null
} 