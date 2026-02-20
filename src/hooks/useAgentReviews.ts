// === src/hooks/useAgentReviews.ts ===
import { useState, useMemo } from 'react'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/lib/types'

export function useAgentReviews() {
  const { config, adsData } = useConfigStore()
  const [isLoading, setIsLoading] = useState(false)
  const [reviewsData, setReviewsData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [responseInfo, setResponseInfo] = useState<any>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8) // Show 8 reviews per page

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const totalItems = reviewsData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentPageData = reviewsData.slice(startIndex, endIndex)
    
    return {
      totalItems,
      totalPages,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
      currentPageData,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    }
  }, [reviewsData, currentPage, itemsPerPage])

  const generateReviews = async () => {
    console.log('🎯 Generating agent reviews for', adsData?.length || 0, 'ads')
    
    setIsLoading(true)
    setError(null)
    setResponseInfo(null)
    setCurrentPage(1) // Reset to first page on new data

    try {
      // Validate required config
      if (!config.n8nWebhookUrl) {
        throw new Error('n8nWebhookUrl is required for agent reviews')
      }

      const agentReviewsUrl = config.n8nWebhookUrl.replace('facebook-ads-analyzer', 'agent-reviews')
      
      const requestData = {
        type: 'agent_reviews',
        message: 'Generate agent reviews for analyzed ads',
        config: {
          facebookToken: config.facebookToken,
          adAccountId: config.adAccountId,
          openaiKey: config.openaiKey,
          targetCpa: config.targetCpa,
          totalBudget: config.totalBudget,
        },
        adsData: adsData || [],
        timestamp: new Date().toISOString(),
      }

      console.log('🚀 Calling agent reviews webhook:', agentReviewsUrl)
      console.log('📦 Request summary:', {
        type: requestData.type,
        adsCount: requestData.adsData.length,
        hasConfig: !!requestData.config.openaiKey,
        hasAdsData: requestData.adsData.length > 0
      })

      const response = await fetch(agentReviewsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
      })

      console.log('📡 Agent reviews response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      // Parse response
      const responseText = await response.text()
      console.log('📝 Agent reviews response length:', responseText.length)
      console.log('📝 Response preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))
      
      if (!responseText.trim()) {
        throw new Error('Empty response from agent reviews webhook - check your n8n workflow')
      }

      let result: any
      try {
        result = JSON.parse(responseText)
        console.log('✅ Successfully parsed agent reviews JSON')
        console.log('📋 Response structure:', {
          isArray: Array.isArray(result),
          keys: result ? Object.keys(result) : [],
          length: Array.isArray(result) ? result.length : 'not array'
        })
      } catch (parseError) {
        console.error('❌ Agent reviews JSON parse error:', parseError)
        console.error('📄 Raw response:', responseText)
        throw new Error(`Invalid JSON response from agent reviews: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
      }

      // Handle different response formats for agent reviews
      let processedReviews = []
      let metadata = null

      if (Array.isArray(result)) {
        if (result.length > 0 && result[0]?.adsData) {
          // Format: [{ status, adsData: [...], message, timestamp }]
          processedReviews = result[0].adsData || []
          metadata = {
            status: result[0].status,
            message: result[0].message,
            timestamp: result[0].timestamp,
            totalAds: processedReviews.length
          }
          console.log(`📊 Nested adsData format: ${processedReviews.length} ad reviews`)
        } else {
          // Direct array of reviews
          processedReviews = result
          console.log(`📊 Direct array format: ${processedReviews.length} reviews`)
        }
      } else if (result?.reviewsData && Array.isArray(result.reviewsData)) {
        processedReviews = result.reviewsData
        metadata = { ...result, reviewsData: undefined }
        console.log(`📊 reviewsData format: ${processedReviews.length} reviews`)
      } else if (result?.adsData && Array.isArray(result.adsData)) {
        processedReviews = result.adsData
        metadata = { ...result, adsData: undefined }
        console.log(`📊 adsData format: ${processedReviews.length} reviews`)
      } else if (result?.data && Array.isArray(result.data)) {
        processedReviews = result.data
        metadata = { ...result, data: undefined }
        console.log(`📊 data format: ${processedReviews.length} reviews`)
      } else if (result?.message || result?.content) {
        // Single message response
        processedReviews = [{
          message: {
            content: result.message || result.content,
            role: 'assistant'
          },
          index: 0
        }]
        metadata = result
        console.log('📊 Single message format')
      } else {
        console.warn('⚠️ Unexpected agent reviews response format:', result)
        console.log('📋 Available properties:', Object.keys(result || {}))
        throw new Error('Agent reviews response does not contain reviews in expected format')
      }

      if (processedReviews.length === 0) {
        console.warn('⚠️ No reviews generated')
        throw new Error('No agent reviews were generated - check your OpenAI API key and workflow')
      }

      // Update state
      setReviewsData(processedReviews)
      setResponseInfo(metadata)
      console.log(`✅ Successfully processed ${processedReviews.length} agent reviews`)

      return {
        success: true,
        reviewsData: processedReviews,
        metadata,
        count: processedReviews.length
      }

    } catch (error) {
      console.error('💥 Agent reviews generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearReviews = () => {
    setReviewsData([])
    setError(null)
    setResponseInfo(null)
    setCurrentPage(1)
  }

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(paginationData.totalPages)
  }

  // Debug current state
  console.log('🔍 useAgentReviews state:', {
    reviewsCount: reviewsData.length,
    currentPage,
    totalPages: paginationData.totalPages,
    currentPageItems: paginationData.currentPageData.length,
    hasResponseInfo: !!responseInfo,
    isLoading,
    error,
    adsDataAvailable: adsData?.length || 0
  })

  return {
    // Data
    reviewsData: paginationData.currentPageData, // Return current page data
    allReviewsData: reviewsData, // Return all data if needed
    responseInfo,
    isLoading,
    error,
    
    // Actions
    generateReviews,
    clearReviews,
    
    // Pagination
    pagination: {
      ...paginationData,
      goToPage,
      goToNextPage,
      goToPrevPage,
      goToFirstPage,
      goToLastPage
    },
    
    // Helper getters
    hasReviews: reviewsData.length > 0,
    reviewsCount: reviewsData.length,
    currentPageCount: paginationData.currentPageData.length
  }
}