// === ThinkingIndicator.tsx (Responsive) ===
import React from 'react'
import { Bot } from 'lucide-react'

export function ThinkingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      
      <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2">
        <span className="text-xs sm:text-sm text-gray-600">🤖 AI is analyzing...</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 rounded-full animate-thinking"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}