import { type ClassValue, clsx } from 'clsx'

/**
 * Utility functions for the application
 */

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatHeader(header: string): string {
  return header
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return `₹${numValue.toFixed(2)}`
}

export function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '<span class="text-primary-500">•</span>')
}