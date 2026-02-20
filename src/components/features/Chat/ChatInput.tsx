// === ChatInput.tsx (Updated to only show selector once) ===
import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
  selectedModel: string | null
  onModelChange: (model: string) => void
}

interface ModelConfig {
  openai: boolean
  claude: boolean
  gemini: boolean
}

export function ChatInput({ onSendMessage, disabled, selectedModel, onModelChange }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false) // ✅ Default to false now
  const [availableModels, setAvailableModels] = useState<ModelConfig>({
    openai: false,
    claude: false,
    gemini: false
  })
  const [loadingModels, setLoadingModels] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check which API keys are available
  useEffect(() => {
    const checkAvailableModels = async () => {
      try {
        setLoadingModels(true)
        
        // Check OpenAI
        const openaiDoc = await getDoc(doc(db, 'config', 'openai'))
        const hasOpenAI = openaiDoc.exists() && !!openaiDoc.data()?.apiKey
        
        // Check Claude
        const claudeDoc = await getDoc(doc(db, 'config', 'claude'))
        const hasClaude = claudeDoc.exists() && !!claudeDoc.data()?.apiKey
        
        // Check Gemini
        const geminiDoc = await getDoc(doc(db, 'config', 'gemini'))
        const hasGemini = geminiDoc.exists() && !!geminiDoc.data()?.apiKey
        
        setAvailableModels({
          openai: hasOpenAI,
          claude: hasClaude,
          gemini: hasGemini
        })
        
        // ✅ Only show selector if NO model is selected at all
        if (!selectedModel) {
          setShowModelSelector(true)
          
          // Auto-select first available model
          if (hasOpenAI) onModelChange('openai')
          else if (hasClaude) onModelChange('claude')
          else if (hasGemini) onModelChange('gemini')
        }
        
      } catch (error) {
        console.error('Error checking available models:', error)
      } finally {
        setLoadingModels(false)
      }
    }

    checkAvailableModels()
  }, []) // ✅ Remove selectedModel from dependencies

  const handleSubmit = async () => {
    if (!message.trim() || disabled || isSending || !selectedModel) return

    const messageToSend = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      await onSendMessage(messageToSend)
    } finally {
      setIsSending(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    const textarea = e.target
    textarea.style.height = 'auto'
    const maxHeight = window.innerWidth < 640 ? 80 : 120
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
  }

  const modelOptions = [
    {
      id: 'openai',
      name: 'OpenAI',
      subtitle: 'GPT-4o-mini',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.78 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.766.766 0 00.388.676l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0l-4.83-2.786A4.504 4.504 0 012.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 01.071 0l4.83 2.791a4.494 4.494 0 01-.676 8.105v-5.678a.79.79 0 00-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.785 0L9.409 9.23V6.897a.066.066 0 01.028-.061l4.83-2.787a4.5 4.5 0 016.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
        </svg>
      ),
      color: 'green',
      available: availableModels.openai
    },
    {
      id: 'claude',
      name: 'Claude',
      subtitle: 'Anthropic',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 3A3.5 3.5 0 0121 6.5v11a3.5 3.5 0 01-3.5 3.5h-11A3.5 3.5 0 013 17.5v-11A3.5 3.5 0 016.5 3h11zm0 2h-11A1.5 1.5 0 005 6.5v11A1.5 1.5 0 006.5 19h11a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0017.5 5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"/>
        </svg>
      ),
      color: 'orange',
      available: availableModels.claude
    },
    {
      id: 'gemini',
      name: 'Gemini',
      subtitle: 'Google',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      ),
      color: 'blue',
      available: availableModels.gemini
    }
  ]

  // ✅ Handle model selection and close modal
  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setShowModelSelector(false) // Close the modal after selection
  }

  // Model Selector Modal
  if (showModelSelector) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Choose AI Model</h2>
                <p className="text-xs sm:text-sm text-gray-500">Select your preferred assistant</p>
              </div>
            </div>
          </div>

          {loadingModels ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {modelOptions.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)} // ✅ Use new handler
                  disabled={!model.available}
                  className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                    selectedModel === model.id
                      ? `border-${model.color}-500 bg-${model.color}-50`
                      : model.available
                      ? 'border-gray-200 hover:border-gray-300 bg-white'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${!model.available && 'grayscale opacity-50'}`}>
                      {model.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                          {model.name}
                        </h3>
                        {selectedModel === model.id && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${model.color}-100 text-${model.color}-700`}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">{model.subtitle}</p>
                      {!model.available && (
                        <p className="text-xs text-red-600 mt-1">API key not configured</p>
                      )}
                    </div>
                    {selectedModel === model.id && (
                      <div className={`w-5 h-5 rounded-full bg-${model.color}-500 flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={() => setShowModelSelector(false)}
            disabled={!selectedModel || loadingModels}
            className="w-full mt-4 sm:mt-6 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue with {selectedModel ? modelOptions.find(m => m.id === selectedModel)?.name : 'Model'}
          </button>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
            You can change the model anytime during the chat
          </p>
        </div>
      </div>
    )
  }

  // Regular Chat Input
  return (
    <div className="space-y-2">
      {/* Selected Model Indicator */}
      {selectedModel && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center">
              {modelOptions.find(m => m.id === selectedModel)?.icon}
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Using {modelOptions.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
          <button
            onClick={() => setShowModelSelector(true)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Change
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 sm:gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your Facebook Ads performance..."
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:border-transparent transition-all"
          rows={1}
          disabled={disabled || isSending}
        />
        
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled || isSending}
          size="md"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0 flex-shrink-0"
        >
          {isSending ? (
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}