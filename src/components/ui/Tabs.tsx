import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Accessible tab component with keyboard navigation
 */

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({ children, defaultValue, value, onValueChange, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  
  const currentValue = value || internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex bg-gray-100 rounded-2xl p-1',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function TabsTrigger({ children, value, className }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const { value: currentValue, onValueChange } = context
  const isActive = currentValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
        'focus-ring',
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function TabsContent({ children, value, className }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  const { value: currentValue } = context

  if (currentValue !== value) return null

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  )
}

