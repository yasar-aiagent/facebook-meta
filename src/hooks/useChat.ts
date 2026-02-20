// === hooks/useChat.ts (Fixed with unique IDs) ===
import { useState, useEffect } from 'react'
import type { ChatMessage } from '@/lib/types'

let messageCounter = 0; // ✅ Add a counter to ensure uniqueness

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const storedMessages = sessionStorage.getItem('chatMessages')
      if (storedMessages) {
        console.log('📦 Loading chat messages from sessionStorage')
        const parsed = JSON.parse(storedMessages)
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Error loading chat messages from sessionStorage:', error)
    }
    
    // Default welcome message if no stored messages
    return [
      {
        id: 'welcome-1', // ✅ Use a fixed unique ID for welcome message
        content: `🚀 Hello! I'm your AI Facebook Ads assistant. I can help you analyze performance, optimize campaigns, and provide insights based on your data.\n\nConfigure your settings and I'll be ready to provide detailed analysis and recommendations!`,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]
  })

  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages))
      sessionStorage.setItem('chatMessagesTimestamp', new Date().toISOString())
      console.log('💬 Chat messages saved to sessionStorage:', messages.length, 'messages')
    } catch (error) {
      console.error('Error saving chat messages:', error)
    }
  }, [messages])

  const addMessage = (content: string, sender: 'user' | 'ai') => {
    // ✅ Create truly unique ID using timestamp + counter
    const uniqueId = `${Date.now()}-${++messageCounter}`
    
    const newMessage: ChatMessage = {
      id: uniqueId,
      content,
      sender,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const setTyping = (typing: boolean) => {
    setIsTyping(typing)
  }

  const clearMessages = () => {
    messageCounter = 0; // ✅ Reset counter when clearing
    
    const welcomeMessage: ChatMessage = {
      id: 'welcome-1',
      content: `🚀 Hello! I'm your AI Facebook Ads assistant. I can help you analyze performance, optimize campaigns, and provide insights based on your data.\n\nConfigure your settings and I'll be ready to provide detailed analysis and recommendations!`,
      sender: 'ai',
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    
    try {
      sessionStorage.removeItem('chatMessages')
      sessionStorage.removeItem('chatMessagesTimestamp')
      console.log('🗑️ Chat messages cleared from sessionStorage')
    } catch (error) {
      console.error('Error clearing chat messages:', error)
    }
  }

  return {
    messages,
    isTyping,
    addMessage,
    setTyping,
    clearMessages,
  }
}