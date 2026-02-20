import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Styled input component with consistent design system
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          className={cn(
            'w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-2xl',
            'placeholder:text-gray-400 focus-ring',
            'transition-colors duration-200',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
