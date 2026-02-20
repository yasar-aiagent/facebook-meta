import React from 'react'
import { Badge } from '@/components/ui/Badge'

/**
 * Status indicator component showing connection states
 */

interface StatusIndicatorProps {
  isOnline: boolean
  label: string
}

export function StatusIndicator({ isOnline, label }: StatusIndicatorProps) {
  return (
    <Badge variant={isOnline ? 'success' : 'error'}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}
    </Badge>
  )
}