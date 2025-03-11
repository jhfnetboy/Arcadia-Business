"use client"

import React, { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

// 创建上下文
const TabsContext = createContext<{
  value: string
  onChange: (value: string) => void
}>({
  value: "",
  onChange: () => {}
})

// Tabs 根组件
interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [tabValue, setTabValue] = useState(value || defaultValue)
  
  const handleValueChange = (newValue: string) => {
    setTabValue(newValue)
    onValueChange?.(newValue)
  }
  
  return (
    <TabsContext.Provider
      value={{
        value: value !== undefined ? value : tabValue,
        onChange: handleValueChange
      }}
    >
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// TabsList 组件
interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// TabsTrigger 组件
interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onChange } = useContext(TabsContext)
  const isActive = selectedValue === value
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// TabsContent 组件
interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useContext(TabsContext)
  const isActive = selectedValue === value
  
  if (!isActive) return null
  
  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 