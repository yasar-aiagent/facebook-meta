import React from 'react'
import { BarChart3 } from 'lucide-react'

/**
 * Dashboard header component with gradient background
 */

export function Header() {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-2xl">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6" />
        <div>
          <h1 className="text-xl font-semibold">Facebook Ads Performance Dashboard</h1>
          <p className="text-primary-100 text-sm mt-1">
            Advanced analytics with AI-powered insights and recommendations
          </p>
        </div>
      </div>
    </div>
  )
}
