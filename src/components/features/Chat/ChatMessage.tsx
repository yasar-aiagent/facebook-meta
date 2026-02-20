// === ChatMessage.tsx (Responsive) ===
import React from 'react'
import { Bot, User } from 'lucide-react'
import { formatTimestamp, formatMessage } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '@/lib/types'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai'
  
  // Safe content extraction - handle different response formats
  const getMessageContent = (content: any): string => {
    // If it's already a string, return it
    if (typeof content === 'string') {
      return content
    }
    
    // If it's an object from n8n AI response
    if (content && typeof content === 'object') {
      // Try common response formats
      if (content.aiResponse) return String(content.aiResponse)
      if (content.output) return String(content.output)
      if (content.text) return String(content.text)
      if (content.response) return String(content.response)
      
      // Fallback: stringify the object
      return JSON.stringify(content, null, 2)
    }
    
    // Fallback for null/undefined
    return ''
  }
  
  const messageContent = getMessageContent(message.content)
  
  return (
    <div className={`flex gap-2 sm:gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar - Responsive Size */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAI
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
            : 'bg-green-500 text-white'
        }`}
      >
        {isAI ? <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      </div>

      {/* Message Content - Responsive Width */}
      <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md ${isAI ? '' : 'text-right'}`}>
        <div
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl ${
            isAI
              ? 'bg-gray-100 text-gray-900'
              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
          }`}
        >
          {messageContent ? (
            <div
              className="text-xs sm:text-sm break-words"
              dangerouslySetInnerHTML={{
                __html: formatMessage(messageContent)
              }}
            />
          ) : (
            <p className="text-xs sm:text-sm text-gray-400 italic">No content</p>
          )}
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 px-1 sm:px-2">
          {formatTimestamp()}
        </p>
      </div>
    </div>
  )
}
