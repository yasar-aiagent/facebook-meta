import { useState, useEffect } from 'react'
import { useVideoAnalysisStore } from '../../../stores/videoAnalysisStore'
import { useAdDataStore } from '../../../stores/adDataStore'
import VideoAnalyzerPanel from './VideoAnalyzer/VideoAnalyzerPanel'
import { Video, BarChart3, Sparkles, AlertCircle, PlayCircle } from 'lucide-react'
import { db, auth } from '../../../firebase/config'
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore'

interface AdAccount {
  id: string;
  name: string;
}

interface AdminElementalAnalysisTabProps {
  adAccounts: AdAccount[];
}

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

const N8N_WEBHOOK_URL = 'https://n8n.scalexagent.cloud/webhook/facebook-ads-analyzer'

export default function AdminElementalAnalysisTab({ adAccounts }: AdminElementalAnalysisTabProps) {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'results' | 'best'>('analyzer')
  const [skippedVideos, setSkippedVideos] = useState<Array<{name: string, id: string, reason: string}>>([])
  const [metaToken, setMetaToken] = useState<string>('')
  const [loadingToken, setLoadingToken] = useState(true)
  const [loadingAds, setLoadingAds] = useState(false)
  const [fetchedAdsData, setFetchedAdsData] = useState<any[]>([])
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'fetch', label: 'Fetch Ads from n8n', status: 'pending' },
    { id: 'analyze', label: 'Analyze All Videos', status: 'pending' },
    { id: 'save_results', label: 'Save Analysis Results', status: 'pending' },
    { id: 'find_best', label: 'Find Best Videos', status: 'pending' },
    { id: 'save_best', label: 'Save Best Videos', status: 'pending' },
  ])

  const { loadModels, results, bestVideos, setResults, setBestVideos } = useVideoAnalysisStore()
  const { adData } = useAdDataStore()

  // Load Meta token from Firestore on mount
  useEffect(() => {
    async function loadMetaToken() {
      try {
        console.log('🔑 Loading Meta token from Firestore...')
        
        const configDoc = await getDoc(doc(db, 'config', 'meta'))
        
        if (!configDoc.exists()) {
          console.warn('⚠️ Meta configuration not found in Firestore')
          setLoadingToken(false)
          return
        }

        const data = configDoc.data()
        const accessToken = data?.accessToken
        
        if (!accessToken) {
          console.warn('⚠️ Meta access token is missing')
          setLoadingToken(false)
          return
        }

        console.log('✅ Meta token loaded successfully')
        setMetaToken(accessToken)
        setLoadingToken(false)
      } catch (error) {
        console.error('❌ Error loading Meta token:', error)
        setLoadingToken(false)
      }
    }

    loadMetaToken()
  }, [])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  // Auto-load ads from database on mount
  useEffect(() => {
    fetchAdsFromDatabase()
  }, [])

  // Auto-load results from Firebase on mount
  useEffect(() => {
    loadResultsFromFirebase()
  }, [])

  // Auto-load best videos from Firebase on mount
  useEffect(() => {
    loadBestVideosFromFirebase()
  }, [])

  // Update step status
  const updateStepStatus = (stepId: string, status: AnalysisStep['status'], progress?: number, message?: string) => {
    setAnalysisSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, message }
        : step
    ))
  }

  // Function to fetch ads from Firebase database
  const fetchAdsFromDatabase = async () => {
    setLoadingAds(true)
    try {
      console.log('📥 Fetching ads from weeklyAdsData/data/ads/...')
      
      const adsArray: any[] = []
      
      const adsSnapshot = await getDocs(collection(db, 'weeklyAdsData', 'data', 'ads'))
      console.log(`📊 Found ${adsSnapshot.size} ads`)
      
      if (adsSnapshot.size === 0) {
        setLoadingAds(false)
        return
      }
      
      adsSnapshot.forEach((adDoc) => {
        const adData = adDoc.data()
        console.log(`  ✅ ${adDoc.id}`)
        adsArray.push(adData)
      })
      
      console.log(`✅ Total ads loaded: ${adsArray.length}`)
      setFetchedAdsData(adsArray)
      
    } catch (error: any) {
      console.error('❌ Error:', error)
    } finally {
      setLoadingAds(false)
    }
  }

  // Function to fetch ads from n8n and save to Firebase
  const fetchAndSaveAdsData = async () => {
    if (adAccounts.length === 0) {
      throw new Error('No ad accounts available')
    }

    if (!metaToken) {
      throw new Error('Meta token not found')
    }

    console.log(`Starting to fetch ads for ${adAccounts.length} accounts`)

    for (let i = 0; i < adAccounts.length; i++) {
      const account = adAccounts[i]
      
      try {
        console.log(`Fetching ads for account: ${account.name}`)
        updateStepStatus('fetch', 'running', ((i + 1) / adAccounts.length) * 100, `Fetching ${account.name} (${i + 1}/${adAccounts.length})`)

        if (!account.id) {
          console.warn(`Skipping ${account.name}: No id found`)
          continue
        }

        const formattedAccountId = account.id.startsWith('act_') 
          ? account.id 
          : `act_${account.id}`

        const currentDate = new Date().toISOString().split('T')[0]

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              adAccountId: formattedAccountId,
              facebookToken: metaToken,
              targetCpa: 0,
              dateFrom: currentDate,
              dateTo: currentDate,
              funnelType: "Leads"
            },
            accountName: account.name,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ads for account ${account.id}: ${response.statusText}`)
        }

        const responseText = await response.text()
        
        if (!responseText || responseText.trim() === '') {
          console.warn(`Empty response for account ${account.name}, skipping...`)
          continue
        }

        let adsData
        try {
          adsData = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`Invalid JSON for account ${account.name}`)
          throw new Error(`Invalid JSON response: ${parseError}`)
        }

        if (!Array.isArray(adsData)) {
          adsData = [adsData]
        }

        console.log(`Received ${adsData.length} ads for account ${account.name}`)
        
        if (adsData.length === 0) {
          continue
        }

        for (const ad of adsData) {
          const adId = ad['Ad ID'] || ad.adId || ad.ad_id || `ad_${Date.now()}_${Math.random()}`
          const adName = ad['Ad Name'] || ad.adName || ad.ad_name || `Ad_${adId}`
          const campaignName = ad['Campaign Name'] || ad.campaignName || ad.campaign_name || 'Unknown_Campaign'
          const adsetName = ad['AdSet Name'] || ad.adsetName || ad.adset_name || 'Unknown_AdSet'
          
          await setDoc(
            doc(db, 'weeklyAdsData', 'data', 'ads', adId),
            {
              ...ad,
              accountId: account.id,
              accountName: account.name,
              campaignName: campaignName,
              adsetName: adsetName,
              adName: adName,
              adId: adId,
              fetchedAt: new Date().toISOString(),
            }
          )
        }

        console.log(`✅ Successfully saved ${adsData.length} ads for account ${account.name}`)

      } catch (error) {
        console.error(`Error processing account ${account.name}:`, error)
        throw error
      }
    }

    console.log('Finished fetching and saving all ads data')
    await fetchAdsFromDatabase()
  }

  // Function to save analysis results to Firebase
 // Function to save analysis results to Firebase
const saveResultsToFirebase = async () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You must be logged in to save results')
  }

  if (results.length === 0) {
    throw new Error('No results to save')
  }

  try {
    console.log('💾 Saving analysis results to Firebase...')
    
    // First, delete all existing results to ensure clean replacement
    const existingResultsSnapshot = await getDocs(
      collection(db, 'videoAnalysis', 'data', 'results')
    )
    
    console.log(`🗑️ Deleting ${existingResultsSnapshot.size} old results...`)
    
    const deletePromises = existingResultsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    )
    await Promise.all(deletePromises)
    
    console.log('✅ Old results deleted')
    
    // Now save new results
    console.log(`💾 Saving ${results.length} new results...`)
    
    for (const result of results) {
      await setDoc(
        doc(db, 'videoAnalysis', 'data', 'results', result.video_id),
        {
          ...result,
          savedAt: new Date().toISOString(),
        }
      )
    }

    console.log('✅ Analysis results saved successfully')
  } catch (error: any) {
    console.error('❌ Error saving results:', error)
    throw error
  }
}

  // Function to save best videos to Firebase
  const saveBestVideosToFirebase = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('You must be logged in to save best videos')
    }

    if (!bestVideos) {
      throw new Error('No best videos analysis to save')
    }

    try {
      console.log('💾 Saving best videos to Firebase...')
      
      const timestamp = new Date().toISOString()
      const docId = `analysis_${Date.now()}`
      
      await setDoc(
        doc(db, 'bestVideosAnalysis', docId),
        {
          ...bestVideos,
          savedAt: timestamp,
          savedBy: currentUser.email,
        }
      )

      console.log('✅ Best videos saved successfully')
    } catch (error: any) {
      console.error('❌ Error saving best videos:', error)
      throw error
    }
  }

  // Function to load analysis results from Firebase
  const loadResultsFromFirebase = async () => {
    try {
      console.log('📥 Loading analysis results from Firebase...')
      
      const resultsSnapshot = await getDocs(
        collection(db, 'videoAnalysis', 'data', 'results')
      )
      
      const loadedResults: any[] = []
      resultsSnapshot.forEach((doc) => {
        loadedResults.push(doc.data())
      })

      console.log(`✅ Loaded ${loadedResults.length} results`)
      
      const store = useVideoAnalysisStore.getState()
      if (loadedResults.length > 0) {
        store.setResults(loadedResults)
      }
    } catch (error: any) {
      console.error('❌ Error loading results:', error)
    }
  }

  // Function to load best videos from Firebase
  const loadBestVideosFromFirebase = async () => {
    try {
      console.log('📥 Loading best videos from Firebase...')
      
      const bestVideosSnapshot = await getDocs(
        collection(db, 'bestVideosAnalysis')
      )
      
      if (bestVideosSnapshot.empty) {
        return
      }

      const analyses: any[] = []
      bestVideosSnapshot.forEach((doc) => {
        analyses.push({ id: doc.id, ...doc.data() })
      })
      
      analyses.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      )
      
      const latestBestVideos = analyses[0]
      
      console.log(`✅ Loaded best videos analysis from ${latestBestVideos.savedAt}`)
      
      const store = useVideoAnalysisStore.getState()
      store.setBestVideos(latestBestVideos)
    } catch (error: any) {
      console.error('❌ Error loading best videos:', error)
    }
  }

  // Main function to run complete analysis
  const runCompleteAnalysis = async () => {
    setIsRunningAnalysis(true)
    
    // Reset all steps to pending
    setAnalysisSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0, message: '' })))

    try {
      // Step 1: Fetch ads from n8n
      updateStepStatus('fetch', 'running', 0, 'Starting fetch...')
      await fetchAndSaveAdsData()
      updateStepStatus('fetch', 'completed', 100, 'Fetch complete')

      // Step 2: Analyze all videos
      updateStepStatus('analyze', 'running', 0, 'Starting video analysis...')
      
      // Trigger analysis through the store
      const store = useVideoAnalysisStore.getState()
      const videos = transformedAdData
        .filter(ad => ad["Video ID"])
        .map(ad => ({
          video_id: ad["Video ID"],
          ad_name: ad["Ad Name"] || "Unknown Ad",
          video_url: `https://www.facebook.com/reel/${ad["Video ID"]}`,
          ad_data: ad
        }))
      
      console.log(`📹 Analyzing ${videos.length} videos...`)
      await store.analyzeVideos(videos, 5) // Using 5 frames as default
      
      // Get fresh results from store after analysis
      const freshResults = useVideoAnalysisStore.getState().results
      console.log(`✅ Analysis complete. Got ${freshResults.length} results`)
      updateStepStatus('analyze', 'completed', 100, `Analysis complete - ${freshResults.length} videos`)

      // Step 3: Save results
      updateStepStatus('save_results', 'running', 0, 'Saving results...')
      
      if (freshResults.length === 0) {
        throw new Error('No results to save after analysis')
      }
      
      console.log(`💾 Saving ${freshResults.length} results to Firebase...`)
      
      for (let i = 0; i < freshResults.length; i++) {
        const result = freshResults[i]
        await setDoc(
          doc(db, 'videoAnalysis', 'data', 'results', result.video_id),
          {
            ...result,
            savedAt: new Date().toISOString(),
          }
        )
        updateStepStatus('save_results', 'running', ((i + 1) / freshResults.length) * 100, `Saving ${i + 1}/${freshResults.length}`)
      }
      
      console.log('✅ All results saved to Firebase')
      updateStepStatus('save_results', 'completed', 100, `${freshResults.length} results saved`)

      // Step 4: Find best videos
      updateStepStatus('find_best', 'running', 0, 'Finding best videos...')
      console.log('🔍 Finding best videos...')
      await store.findBestVideos()
      
      // Get fresh best videos from store
      const freshBestVideos = useVideoAnalysisStore.getState().bestVideos
      console.log('✅ Best videos identified:', freshBestVideos ? 'Yes' : 'No')
      updateStepStatus('find_best', 'completed', 100, 'Best videos identified')

      // Step 5: Save best videos
      updateStepStatus('save_best', 'running', 0, 'Saving best videos...')
      
      if (!freshBestVideos) {
        throw new Error('No best videos analysis to save')
      }
      
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('You must be logged in to save best videos')
      }
      
      console.log('💾 Saving best videos to Firebase...')
      const timestamp = new Date().toISOString()
      const docId = `analysis_${Date.now()}`
      
      await setDoc(
        doc(db, 'bestVideosAnalysis', docId),
        {
          ...freshBestVideos,
          savedAt: timestamp,
          savedBy: currentUser.email,
        }
      )
      
      console.log('✅ Best videos saved to Firebase')
      updateStepStatus('save_best', 'completed', 100, 'Best videos saved')

      console.log('✅ Complete analysis pipeline finished successfully')
      alert('Analysis complete! All steps finished successfully.')
      
    } catch (error: any) {
      console.error('❌ Analysis pipeline error:', error)
      
      // Mark current running step as error
      setAnalysisSteps(prev => prev.map(step => 
        step.status === 'running' 
          ? { ...step, status: 'error', message: error.message }
          : step
      ))
      
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setIsRunningAnalysis(false)
    }
  }

  // Transform and validate the ad data
  const transformedAdData = fetchedAdsData.map(ad => ({
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
    "Video ID": ad['Video ID'] || ad.videoId || ad.video_id || '',
    "Video Title": ad['Video Title'] || ad.videoTitle || ad.video_title || '',
    "isTopPerformer": ad['isTopPerformer'] || ad.isTopPerformer || false
  }))

  // Validate and filter ads
  const skipped: Array<{name: string, id: string, reason: string}> = []
  const validAdData = transformedAdData.filter(ad => {
    const videoId = ad['Video ID']
    const adName = ad['Ad Name']

    if (!videoId || videoId.trim() === '') {
      skipped.push({
        name: adName || 'Unknown Ad',
        id: 'No ID',
        reason: 'Missing Video ID'
      })
      return false
    }

    if (!/^\d+$/.test(videoId) || videoId.length < 10 || videoId.length > 20) {
      skipped.push({
        name: adName || 'Unknown Ad',
        id: videoId,
        reason: 'Invalid Video ID format'
      })
      return false
    }

    return true
  })

  useEffect(() => {
    setSkippedVideos(skipped)
  }, [fetchedAdsData.length])

function getStepStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500 text-white'
    case 'running':
      return 'bg-indigo-600 text-white'
    case 'error':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-300 text-gray-600'
  }
}


function getStepStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✓'
    case 'running':
      return '...'
    case 'error':
      return '✗'
    default:
      return ''
  }
}



 return (
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Top Row - Title and Main Action */}
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

          {/* Main Action Button - Desktop */}
          <button
            onClick={runCompleteAnalysis}
            disabled={isRunningAnalysis || adAccounts.length === 0 || loadingToken || !metaToken}
            className={`hidden lg:flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm ${
              isRunningAnalysis || adAccounts.length === 0 || loadingToken || !metaToken
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            <PlayCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isRunningAnalysis ? 'animate-pulse' : ''}`} />
            <span>
              {loadingToken 
                ? 'Loading Token...'
                : !metaToken
                ? 'No Token Found'
                : isRunningAnalysis 
                ? 'Running Analysis...' 
                : 'Run Complete Analysis'}
            </span>
          </button>
        </div>

        {/* Stats Row - Responsive */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {validAdData.length > 0 && (
            <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {validAdData.length} valid video{validAdData.length !== 1 ? 's' : ''}
            </span>
          )}
          {skippedVideos.length > 0 && (
            <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {skippedVideos.length} skipped
            </span>
          )}
        </div>

        {/* Mobile Action Button */}
        <button
          onClick={runCompleteAnalysis}
          disabled={isRunningAnalysis || adAccounts.length === 0 || loadingToken || !metaToken}
          className={`lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-3 rounded-lg font-medium transition-all text-sm ${
            isRunningAnalysis || adAccounts.length === 0 || loadingToken || !metaToken
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md'
          }`}
        >
          <PlayCircle className={`w-4 h-4 ${isRunningAnalysis ? 'animate-pulse' : ''}`} />
          <span>
            {loadingToken 
              ? 'Loading...'
              : !metaToken
              ? 'No Token'
              : isRunningAnalysis 
              ? 'Running...' 
              : 'Run Analysis'}
          </span>
        </button>
        
        {/* Progress Steps */}
        {isRunningAnalysis && (
          <div className="mt-4 sm:mt-6 bg-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-100">
            <h3 className="text-xs sm:text-sm font-semibold text-indigo-900 mb-2 sm:mb-3">Analysis Progress</h3>
            <div className="space-y-2 sm:space-y-3">
              {analysisSteps.map((step) => (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getStepStatusColor(step.status)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {getStepStatusIcon(step.status)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-900 truncate">{step.label}</span>
                    </div>
                    {step.message && (
                      <span className="text-xs text-gray-600 hidden sm:block">{step.message}</span>
                    )}
                  </div>
                  {step.status === 'running' && step.progress !== undefined && (
                    <div className="ml-7 sm:ml-8 w-full bg-indigo-200 rounded-full h-1.5 sm:h-2">
                      <div 
                        className="bg-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
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
            {results.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {results.length}
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
      {loadingAds ? (
        <div className="bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 animate-spin" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Loading Data...</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              Fetching ads from database...
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
            {fetchedAdsData.length > 0 
              ? `Found ${fetchedAdsData.length} ad${fetchedAdsData.length !== 1 ? 's' : ''}, but none have valid video IDs.`
              : 'No ads found in database. Click "Run Complete Analysis" to sync and analyze new data.'}
          </p>
        </div>
      ) : (
        <VideoAnalyzerPanel
          adData={validAdData}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </main>
  </div>
)
}