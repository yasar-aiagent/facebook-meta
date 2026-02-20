// === src/hooks/useAnalysis.ts (With SessionStorage Support) ===
import { useState, useEffect } from 'react'
import { useConfigStore } from '@/stores/configStore'
import type { Config, AdData, ReviewData } from '@/lib/types'

export function useAnalysis() {
  const { adsData, reviewsData, setAdsData, setReviewsData } = useConfigStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Load data from sessionStorage on mount if store is empty
  useEffect(() => {
    if (!adsData || adsData.length === 0) {
      try {
        const storedAdsData = sessionStorage.getItem('adPerformanceData')
        if (storedAdsData) {
          const parsedData = JSON.parse(storedAdsData)
          setAdsData(parsedData)
          console.log('📦 Loaded ads data from sessionStorage:', parsedData.length, 'ads')
        }
      } catch (error) {
        console.error('Error loading ads data from sessionStorage:', error)
      }
    }
  }, [adsData, setAdsData])

  const analyzeAds = async (config: Partial<Config>) => {
    setIsLoading(true)
    setError(null)

    try {
      const requestData = {
        type: 'advanced_facebook_ads_analysis',
        message: 'Run advanced Facebook Ads analysis for configured account',
        config: {
          facebookToken: config.facebookToken,
          adAccountId: config.adAccountId,
          targetCpa: config.targetCpa,
          dateFrom: config.dateFrom,
          dateTo: config.dateTo,
          funnelType: config.funnelType,
        },
        timestamp: new Date().toISOString(),
      }

      // ✅ SECURE - Log without sensitive data
      console.log('🚀 Sending analysis request:', {
        adAccountId: config.adAccountId,
        dateRange: `${config.dateFrom} to ${config.dateTo}`,
        funnelType: config.funnelType,
        targetCpa: config.targetCpa,
        // ❌ DO NOT LOG: facebookToken, n8nWebhookUrl
      })

      const response = await fetch(config.n8nWebhookUrl!, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        mode: 'cors',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // ✅ SECURE - Log response summary only
      console.log('✅ Analysis response received:', {
        isArray: Array.isArray(result),
        itemCount: Array.isArray(result) ? result.length : 0,
        hasData: !!result
      })
      
      // Handle array response (your format)
      let processedAdsData: AdData[] = []
      
      if (Array.isArray(result) && result.length > 0) {
        processedAdsData = result
        console.log(`📊 Processing ${processedAdsData.length} ads from response`)
        
        // CRITICAL: Update the store immediately
        setAdsData(processedAdsData)
        console.log('💾 Store updated with ads data:', processedAdsData.length, 'items')
        
        // ✅ Save to sessionStorage
        try {
          sessionStorage.setItem('adPerformanceData', JSON.stringify(processedAdsData))
          sessionStorage.setItem('adPerformanceDataTimestamp', new Date().toISOString())
          console.log('✅ Ads data saved to sessionStorage')
        } catch (storageError) {
          console.error('❌ Error saving to sessionStorage:', storageError)
          // Continue even if storage fails
        }
      }

      setIsLoading(false)

      return {
        status: 'success',
        adsData: processedAdsData,
        reviewsData: [],
        ai_insights: `Successfully loaded ${processedAdsData.length} ads`
      }
      
    } catch (error) {
      console.error('💥 Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setIsLoading(false)
      throw error
    }
  }

  // ✅ Debug the current store state (without sensitive data)
  console.log('🔍 useAnalysis hook state:', {
    adsDataLength: adsData?.length || 0,
    hasAdsData: !!(adsData && adsData.length > 0),
    reviewsDataLength: reviewsData?.length || 0,
    isLoading,
    hasError: !!error
  })

  return {
    adsData,
    reviewsData,
    isLoading,
    error,
    analyzeAds,
    sendChatMessage: async () => ({}) // placeholder
  }
}