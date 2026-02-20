import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Reusable button component with Apple-inspired design
 * Supports multiple variants and sizes
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-200',
          'focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          {
            'bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0': variant === 'primary',
            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300': variant === 'secondary',
            'text-gray-600 hover:text-gray-900 hover:bg-gray-100': variant === 'ghost',
          },
          // Sizes
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
