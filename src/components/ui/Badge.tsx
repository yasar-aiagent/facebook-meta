import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Status badge component for showing online/offline states
 */

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'error' | 'warning' | 'neutral'
  className?: string
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full',
        {
          'bg-green-100 text-green-800 border border-green-200': variant === 'success',
          'bg-red-100 text-red-800 border border-red-200': variant === 'error',
          'bg-yellow-100 text-yellow-800 border border-yellow-200': variant === 'warning',
          'bg-gray-100 text-gray-800 border border-gray-200': variant === 'neutral',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
