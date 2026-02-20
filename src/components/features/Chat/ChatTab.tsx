// === ChatTab.tsx (With Firebase Video Data Loading) ===
import React, { useState, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ThinkingIndicator } from './ThinkingIndicator'
import { useChat } from '@/hooks/useChat'
import { useConfigStore } from '@/stores/configStore'
import { Bot, Trash2, Database, Video,Sparkles } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function ChatTab() {
  const { messages, isTyping, addMessage, setTyping, clearMessages } = useChat()
  const { config, adsData, setAdsData } = useConfigStore()
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(false)
  const [videoAnalysisResults, setVideoAnalysisResults] = useState<any[]>([])
  const [bestVideosData, setBestVideosData] = useState<any>(null)
  
  // ✅ Initialize from localStorage to persist selection
  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    return localStorage.getItem('selectedAiModel')
  })

  // ✅ Load data from multiple sources on mount
  useEffect(() => {
    loadDataFromAllSources()
  }, [adsData])

  const loadDataFromAllSources = async () => {
    // Priority 1: Check store for ads data
    if (adsData && adsData.length > 0) {
      console.log('✅ Using adsData from store:', adsData.length, 'ads')
    } else {
      // Priority 2: Check sessionStorage for ads data
      try {
        const storedAdsData = sessionStorage.getItem('adPerformanceData')
        if (storedAdsData) {
          const parsedData = JSON.parse(storedAdsData)
          setAdsData(parsedData)
          console.log('📦 Loaded adsData from sessionStorage:', parsedData.length, 'ads')
        }
      } catch (error) {
        console.error('Error loading from sessionStorage:', error)
      }
    }

    // Always load video analysis data from Firebase
    await loadVideoDataFromFirebase()
  }

 const loadVideoDataFromFirebase = async () => {
  setIsLoadingFromDB(true)
  try {
    const resultsSnapshot = await getDocs(
      collection(db, 'videoAnalysis', 'data', 'results')
    )
    
    const results: any[] = []
    resultsSnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() })
    })

    // ✅ Get current user's video IDs from adsData
    const currentAdsData = adsData?.length > 0 
      ? adsData 
      : JSON.parse(sessionStorage.getItem('adPerformanceData') || '[]')

    const userVideoIds = new Set(
      currentAdsData
        .map((ad: any) => ad['Video ID'] || ad.video_id || '')
        .filter(Boolean)
    )

    // ✅ Filter to only current user's videos
    const filteredResults = userVideoIds.size > 0
      ? results.filter(r => userVideoIds.has(r.video_id))
      : results

    setVideoAnalysisResults(filteredResults)
    console.log(`✅ Loaded ${filteredResults.length}/${results.length} relevant video analyses`)

    // Load best videos and filter too
    const bestVideosSnapshot = await getDocs(collection(db, 'bestVideosAnalysis'))
    
    if (!bestVideosSnapshot.empty) {
      const latestDoc = bestVideosSnapshot.docs.find(doc => doc.id === 'latest')
      const latestBestVideos = latestDoc?.data() || (() => {
        const analyses = bestVideosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        analyses.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
        return analyses[0]
      })()

      // ✅ Filter best videos too
      if (latestBestVideos?.top_videos && userVideoIds.size > 0) {
        const filtered = {
          ...latestBestVideos,
          top_videos: latestBestVideos.top_videos.filter(
            (v: any) => userVideoIds.has(v.video_id)
          )
        }
        setBestVideosData(filtered)
      } else {
        setBestVideosData(latestBestVideos)
      }
    }

    addMessage(
      `✅ Loaded ${filteredResults.length} relevant video analyses. Ready to answer your questions!`,
      'ai'
    )

  } catch (error) {
    console.error('❌ Error loading from Firebase:', error)
    addMessage('❌ Error loading video analysis data from database.', 'ai')
  } finally {
    setIsLoadingFromDB(false)
  }
}

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    localStorage.setItem('selectedAiModel', model)
  }

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all chat messages?')) {
      clearMessages()
    }
  }

  const handleRefreshData = async () => {
    await loadVideoDataFromFirebase()
  }

  const handleSendMessage = async (message: string) => {
    // ✅ Load config from sessionStorage
    let configData = { ...config }
    
    try {
      const storedConfig = sessionStorage.getItem('sidebarConfig')
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig)
        configData = {
          ...configData,
          dateFrom: parsedConfig.dateFrom || configData.dateFrom,
          dateTo: parsedConfig.dateTo || configData.dateTo,
          adAccountId: parsedConfig.adAccountId || configData.adAccountId,
          targetCpa: parsedConfig.targetCpa || configData.targetCpa,
          funnelType: parsedConfig.funnelType || configData.funnelType,
        }
        console.log('📦 Loaded config from sessionStorage')
      }
    } catch (error) {
      console.error('Error loading config:', error)
    }

    // ✅ Check if configuration is complete
    const isConfigComplete = !!(
      configData.adAccountId &&
      configData.dateFrom &&
      configData.dateTo &&
      configData.targetCpa
    )

    if (!isConfigComplete) {
      addMessage('⚠️ Please configure all settings first. Required: Ad Account ID, Date Range, and Target CPA.', 'ai')
      return
    }

    if (!selectedModel) {
      addMessage('⚠️ Please select an AI model first.', 'ai')
      return
    }

    addMessage(message, 'user')
    setTyping(true)

    try {
      // ✅ Get ads data from store or sessionStorage
      let currentAdsData = adsData

      if (!currentAdsData || currentAdsData.length === 0) {
        try {
          const storedAdsData = sessionStorage.getItem('adPerformanceData')
          if (storedAdsData) {
            currentAdsData = JSON.parse(storedAdsData)
            console.log('📦 Using adsData from sessionStorage:', currentAdsData.length, 'ads')
          }
        } catch (error) {
          console.error('Error loading adsData:', error)
        }
      }

      // Check if we have any data to send
      if (!currentAdsData || currentAdsData.length === 0) {
        if (videoAnalysisResults.length === 0 && !bestVideosData) {
          addMessage('⚠️ No data available. Please run analysis from the sidebar first.', 'ai')
          setTyping(false)
          return
        }
      }

      console.log(`📊 Sending data to AI:`)
      console.log(`  - Ads: ${currentAdsData?.length || 0}`)
      console.log(`  - Video Analysis Results: ${videoAnalysisResults.length}`)
      console.log(`  - Best Videos: ${bestVideosData ? 'Yes' : 'No'}`)

      // ✅ Call the CHAT webhook with ALL data including video analysis
      const requestData = {
        type: 'chat_ai_bot',
        message: message,
        model: selectedModel,
        config: {
          adAccountId: configData.adAccountId,
          targetCpa: configData.targetCpa,
          dateFrom: configData.dateFrom,
          dateTo: configData.dateTo,
          funnelType: configData.funnelType
        },
        adsData: currentAdsData || [],
        videoAnalysisResults: videoAnalysisResults, // ✅ Video analysis results
        bestVideosData: bestVideosData, // ✅ Best videos analysis
        timestamp: new Date().toISOString(),
      }

      // ✅ SECURE - Log without full data
      console.log('🤖 Calling chat webhook:', {
        model: selectedModel,
        adsCount: currentAdsData?.length || 0,
        videoAnalysisCount: videoAnalysisResults.length,
        hasBestVideos: !!bestVideosData,
        config: {
          adAccountId: configData.adAccountId,
          dateRange: `${configData.dateFrom} to ${configData.dateTo}`,
          funnelType: configData.funnelType
        }
      })

      const response = await fetch('https://n8n.scalexagent.cloud/webhook/chat-ai-bot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
      })

      console.log('📡 Chat response:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Chat webhook success')
      
      // Handle different response formats
      let aiResponse = 'Analysis completed successfully!'
      
      if (Array.isArray(result)) {
        aiResponse = result[0]?.message?.content || result[0] || 'Got response from AI'
      } else if (result?.ai_insights) {
        aiResponse = result.ai_insights
      } else if (result?.response) {
        aiResponse = result.response
      } else if (result?.message) {
        aiResponse = result.message
      } else if (typeof result === 'string') {
        aiResponse = result
      }

      addMessage(aiResponse, 'ai')
      
    } catch (error) {
      console.error('💥 Chat webhook error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Connection error'
      addMessage(
        `🔧 Connection error: ${errorMessage}. Please check your chat webhook configuration.`,
        'ai'
      )
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
      {/* Chat Header - Mobile Friendly */}
      <div className="border-b border-gray-100 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-xl sm:rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-xs text-gray-600 hidden sm:block truncate">
                {adsData && adsData.length > 0 
                  ? `${adsData.length} ads`
                  : ''} 
                {videoAnalysisResults.length > 0 
                  ? ` • ${videoAnalysisResults.length} video analyses`
                  : ''}
                {bestVideosData
                  ? ` • Best videos loaded`
                  : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Refresh Data Button */}
            <button
              onClick={handleRefreshData}
              disabled={isLoadingFromDB}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh video data from database"
            >
              <Video className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLoadingFromDB ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Status Badges */}
        {(adsData?.length > 0 || videoAnalysisResults.length > 0 || bestVideosData) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {adsData && adsData.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {adsData.length} ads
              </span>
            )}
            {videoAnalysisResults.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {videoAnalysisResults.length} video analyses
              </span>
            )}
            {bestVideosData && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Sparkles className="w-3 h-3 mr-1" />
                Best videos
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages - Responsive Padding */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {isLoadingFromDB ? (
              <>
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3 sm:mb-4" />
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                  Loading Video Data...
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm">
                  Fetching video analysis results and best videos from database...
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">
                  Welcome to AI Assistant
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm">
                  Ask me about your Facebook Ads performance, video analysis insights, best performing videos, and optimization strategies.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <ThinkingIndicator />}
          </>
        )}
      </div>

      {/* Chat Input - Responsive Padding */}
      <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isTyping || isLoadingFromDB}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  )
}