import { useState, useEffect, useMemo } from 'react'
import { useVideoAnalysisStore } from '../../../stores/videoAnalysisStore'
import { useAdDataStore } from '../../../stores/adDataStore'
import { Video, BarChart3, Sparkles, AlertCircle, PlayCircle, Loader2 } from 'lucide-react'
import VideoAnalyzerPanelUser from './VideoAnalyzer/VideoAnalyzerPanelUser'
import { db } from '../../../firebase/config'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { useAnalysis } from '../../../hooks/useAnalysis'

export default function ElementalAnalysisTab() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'results' | 'best'>('analyzer')
  const [skippedVideos, setSkippedVideos] = useState<Array<{name: string, id: string, reason: string}>>([])
  const { loadModels, results, bestVideos, setUserResults, setBestVideos,userResults } = useVideoAnalysisStore()
  const { adsData: adData } = useAnalysis()
  const [loadedResultsMap, setLoadedResultsMap] = useState<Map<string, any>>(new Map())
  const [isLoadingResults, setIsLoadingResults] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    console.log('🔍 DIAGNOSTIC:')
    console.log('  adData from store:', adData)
    console.log('  adData length:', adData.length)
    console.log('  First 3 ads:', adData.slice(0, 3))
    
    adData.forEach((ad, i) => {
      if (i < 5) {
        console.log(`  Ad ${i}:`, {
          'Video ID': ad['Video ID'],
          'video_id': ad.video_id,
          'Ad Name': ad['Ad Name'],
          keys: Object.keys(ad)
        })
      }
    })
  }, [adData])

  useEffect(() => {
    loadModels()
  }, [])

 useEffect(() => {
  if (adData.length > 0) {
    loadSavedResults()
    loadBestVideosFromFirebase()
  }
}, [adData])

  const loadSavedResults = async () => {
    setIsLoadingResults(true)
    try {
      console.log('📥 Loading saved analysis results...')
      
      const resultsSnapshot = await getDocs(
        collection(db, 'videoAnalysis', 'data', 'results')
      )
      
      const resultsMap = new Map<string, any>()
      
      resultsSnapshot.forEach((doc) => {
        const result = doc.data()
        resultsMap.set(result.video_id, result)
      })

      setLoadedResultsMap(resultsMap)
      console.log(`✅ Loaded ${resultsMap.size} saved results from database`)
    } catch (error: any) {
      console.error('❌ Error loading results:', error)
    } finally {
      setIsLoadingResults(false)
    }
  }

  // Add this new function to load best videos
 const loadBestVideosFromFirebase = async () => {
  try {
    const bestVideosSnapshot = await getDocs(collection(db, 'bestVideosAnalysis'))
    if (bestVideosSnapshot.empty) return

    const latestDoc = bestVideosSnapshot.docs.find(doc => doc.id === 'latest')
    const latestBestVideos = latestDoc?.data() || (() => {
      const analyses = bestVideosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      analyses.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      return analyses[0]
    })()

    // ✅ Get current user's video IDs from adData
    const userVideoIds = new Set(
      adData
        .map(ad => ad['Video ID'] || ad.video_id || '')
        .filter(Boolean)
    )

    // ✅ Filter top_videos to only current user's ads
    if (latestBestVideos?.top_videos) {
      const filtered = {
        ...latestBestVideos,
        top_videos: latestBestVideos.top_videos.filter(
          (v: any) => userVideoIds.has(v.video_id)
        )
      }
      setBestVideos(filtered)
    }
  } catch (error: any) {
    console.error('❌ Error loading best videos:', error)
  }
}
  // Transform and validate the ad data
  const { transformedAdData, validAdData, skipped } = useMemo(() => {
    const transformed = adData.map(ad => {
      const videoId = ad['Video ID'] || ad.videoId || ad.video_id || ''
      const savedResult = loadedResultsMap.get(videoId)
      
      return {
        "Active Status": ad['Active Status'] || ad.activeStatus || '',
        "Ad ID": ad['Ad ID'] || ad.adId || ad.ad_id || '',
        "Ad Name": ad['Ad Name'] || ad.adName || ad.ad_name || '',
        "AdSet Name": ad['AdSet Name'] || ad.adsetName || ad.adset_name || '',
        "Best Ads?": ad['Best Ads?'] || ad.bestAds || '',
        "CPC": ad['CPC'] || ad.cpc || '',
        "CPM": ad['CPM'] || ad.cpm || '',
        "CTA Type": ad['CTA Type'] || ad.ctaType || '',
        "CTR": ad['CTR'] || ad.ctr || '',
        "Campaign Name": ad['Campaign Name'] || ad.campaignName || ad.campaign_name || '',
        "Clicks > LPV": ad['Clicks > LPV'] || '',
        "Clicks > lead": ad['Clicks > lead'] || '',
        "Cost / Click": ad['Cost / Click'] || ad.costPerClick || '',
        "Cost / LPV": ad['Cost / LPV'] || '',
        "Cost Per Acquisition": ad['Cost Per Acquisition'] || ad.cpa || ad.costPerAcquisition || '',
        "Date Processed": ad['Date Processed'] || ad.dateProcessed || '',
        "Image URL": ad['Image URL'] || ad.imageUrl || '',
        "Impressions": ad['Impressions'] || ad.impressions || '',
        "LPV > lead": ad['LPV > lead'] || '',
        "Landing Page Views": ad['Landing Page Views'] || ad.landingPageViews || '',
        "Leads": ad['Leads'] || ad.leads || '',
        "Link URL": ad['Link URL'] || ad.linkUrl || '',
        "Outbound Clicks": ad['Outbound Clicks'] || ad.outboundClicks || ad.clicks || '',
        "Purchases": ad['Purchases'] || ad.purchases || '',
        "ROAS": ad['ROAS'] || ad.roas || '',
        "Registrations": ad['Registrations'] || ad.registrations || '',
        "Spend": ad['Spend'] || ad.spend || '',
        "Thumbnail URL": ad['Thumbnail URL'] || ad.thumbnailUrl || ad.thumbnail_url || '',
        "Video Body": ad['Video Body'] || ad.videoBody || ad.video_body || '',
        "Video ID": videoId,
        "Video Title": ad['Video Title'] || ad.videoTitle || ad.video_title || '',
        "isTopPerformer": ad['isTopPerformer'] || ad.isTopPerformer || false,
        "savedResult": savedResult,
        "hasAnalysis": !!savedResult
      }
    })

    const skippedList: Array<{name: string, id: string, reason: string}> = []
    const valid = transformed.filter(ad => {
      const videoId = ad['Video ID']
      const adName = ad['Ad Name']

      if (!videoId || videoId.trim() === '') {
        skippedList.push({
          name: adName || 'Unknown Ad',
          id: 'No ID',
          reason: 'Missing Video ID'
        })
        return false
      }

      if (!/^\d+$/.test(videoId) || videoId.length < 10 || videoId.length > 20) {
        skippedList.push({
          name: adName || 'Unknown Ad',
          id: videoId,
          reason: 'Invalid Video ID format'
        })
        return false
      }

      return true
    })

    // Update the store with only the matching results
    const matchingResults = valid
      .filter(ad => ad.hasAnalysis)
      .map(ad => ad.savedResult)
    
    setUserResults(matchingResults)

    return { transformedAdData: transformed, validAdData: valid, skipped: skippedList }
  }, [adData, loadedResultsMap, setUserResults])

  useEffect(() => {
    setSkippedVideos(skipped)
  }, [skipped])

  // Analyze videos function
  const analyzeVideos = async (videosToAnalyze: any[]) => {
    setIsAnalyzing(true)
    setAnalysisProgress({ current: 0, total: videosToAnalyze.length })

    try {
      const store = useVideoAnalysisStore.getState()
      
      const videos = videosToAnalyze.map(ad => ({
        video_id: ad["Video ID"],
        ad_name: ad["Ad Name"] || "Unknown Ad",
        video_url: `https://www.facebook.com/reel/${ad["Video ID"]}`,
        ad_data: ad
      }))

      console.log(`📹 Analyzing ${videos.length} videos...`)
      
      // Analyze videos with progress tracking
      await store.analyzeVideos(videos, 5, (current, total) => {
        setAnalysisProgress({ current, total })
      })

      // Get fresh results from store
      const freshResults = useVideoAnalysisStore.getState().results
      console.log(`✅ Analysis complete. Got ${freshResults.length} results`)

      // Save results to Firebase
      console.log(`💾 Saving ${freshResults.length} results to Firebase...`)
      
      for (const result of freshResults) {
        await setDoc(
          doc(db, 'videoAnalysis', 'data', 'results', result.video_id),
          {
            ...result,
            savedAt: new Date().toISOString(),
          }
        )
      }

      console.log('✅ All results saved to Firebase')
      
      // Reload results to update UI
      await loadSavedResults()
      
      alert(`Analysis complete! ${freshResults.length} video${freshResults.length !== 1 ? 's' : ''} analyzed and saved.`)
      
    } catch (error: any) {
      console.error('❌ Analysis error:', error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress({ current: 0, total: 0 })
    }
  }

  // Analyze all videos
  const handleAnalyzeAll = async () => {
    if (validAdData.length === 0) {
      alert('No valid videos to analyze')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to analyze ALL ${validAdData.length} videos?\n\n` +
      `This will re-analyze ${validAdData.filter(ad => ad.hasAnalysis).length} existing results and ` +
      `analyze ${validAdData.filter(ad => !ad.hasAnalysis).length} new videos.`
    )

    if (!confirmed) return

    await analyzeVideos(validAdData)
  }

  // Analyze only pending videos
  const handleAnalyzePending = async () => {
    const pendingVideos = validAdData.filter(ad => !ad.hasAnalysis)

    if (pendingVideos.length === 0) {
      alert('No pending videos to analyze. All videos have been analyzed already!')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to analyze ${pendingVideos.length} pending video${pendingVideos.length !== 1 ? 's' : ''}?`
    )

    if (!confirmed) return

    await analyzeVideos(pendingVideos)
  }

  const analyzedCount = validAdData.filter(ad => ad.hasAnalysis).length
  const pendingCount = validAdData.filter(ad => !ad.hasAnalysis).length

 return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Top Row - Title and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Video Ad Analyzer</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">AI-Powered Analysis</p>
              </div>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {validAdData.length > 0 && !isAnalyzing && (
                <>
                  <button
                    onClick={handleAnalyzeAll}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Analyze All ({validAdData.length})
                  </button>
                  
                  {pendingCount > 0 && (
                    <button
                      onClick={handleAnalyzePending}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Analyze Pending ({pendingCount})
                    </button>
                  )}
                </>
              )}

              {isAnalyzing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium text-sm">
                    Analyzing {analysisProgress.current}/{analysisProgress.total}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Row - Responsive */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {validAdData.length > 0 && (
              <>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {validAdData.length} total
                </span>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {analyzedCount} analyzed
                </span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {pendingCount} pending
                  </span>
                )}
              </>
            )}
            {skippedVideos.length > 0 && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {skippedVideos.length} skipped
              </span>
            )}
          </div>

          {/* Mobile Action Buttons */}
          <div className="lg:hidden mt-3 flex flex-col sm:flex-row gap-2">
            {validAdData.length > 0 && !isAnalyzing && (
              <>
                <button
                  onClick={handleAnalyzeAll}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm flex-1"
                >
                  <PlayCircle className="w-4 h-4" />
                  Analyze All ({validAdData.length})
                </button>
                
                {pendingCount > 0 && (
                  <button
                    onClick={handleAnalyzePending}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm flex-1"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Pending ({pendingCount})
                  </button>
                )}
              </>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium text-sm">
                  {analysisProgress.current}/{analysisProgress.total}
                </span>
              </div>
            )}
          </div>
          
          {/* Analysis Progress Bar */}
          {isAnalyzing && (
            <div className="mt-4 bg-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-indigo-900">
                  Analyzing videos...
                </span>
                <span className="text-xs sm:text-sm text-indigo-700">
                  {analysisProgress.current} / {analysisProgress.total}
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(analysisProgress.current / analysisProgress.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Skipped Videos Warning */}
          {skippedVideos.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">
                    {skippedVideos.length} video{skippedVideos.length !== 1 ? 's' : ''} skipped due to invalid data:
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {skippedVideos.map((video, idx) => (
                      <div key={idx} className="text-xs text-yellow-800 bg-yellow-100 rounded px-2 py-1.5">
                        <span className="font-medium break-words">{video.name}</span>
                        <span className="text-yellow-700"> - ID: {video.id}</span>
                        <span className="italic text-yellow-600"> - {video.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-[73px] sm:top-[81px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'analyzer'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Batch Analysis</span>
              <span className="sm:hidden">Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Results
              {userResults.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {userResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('best')}
              className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === 'best'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Best Videos</span>
              <span className="sm:hidden">Best</span>
              {bestVideos && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  AI
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isLoadingResults ? (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-600"></div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Loading Saved Results...</h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Checking for existing video analysis...
              </p>
            </div>
          </div>
        ) : validAdData.length === 0 ? (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-200 shadow-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Valid Video Ads
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-2 max-w-md mx-auto">
              {adData.length > 0 
                ? `Found ${adData.length} ad${adData.length !== 1 ? 's' : ''}, but none have valid video IDs.`
                : 'Please load ad data from the Ad Performance table first.'}
            </p>
          </div>
        ) : (
          <VideoAnalyzerPanelUser
            adData={validAdData}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </main>
    </div>
  )
}