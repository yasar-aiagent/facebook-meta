import { useState } from 'react'
import { useVideoAnalysisStore } from '../../../../stores/videoAnalysisStore'
import { VideoForAnalysis } from '../../../../types/videoAnalysis'
import ModelSelector from './ModelSelector'
import AnalysisProgress from './AnalysisProgress'
import VideoCard from './VideoCard'
import BestVideosCard from './BestVideosCard'
import AnalysisDetails from './AnalysisDetails'
import { Play, RefreshCw, Trash2, Download, BarChart3 } from 'lucide-react'


interface AdDataItem {
  "Video ID"?: string;
  "Ad Name"?: string;
  "Ad ID"?: string;
  "Campaign Name"?: string;
  "Impressions"?: string;
  "Spend"?: string;
  "CTR"?: string;
  "CPC"?: string;
  "Thumbnail URL"?: string;
  [key: string]: any;
}

interface VideoAnalyzerPanelProps {
  adData: AdDataItem[]
  activeTab: 'analyzer' | 'results' | 'best'
  onTabChange: (tab: 'analyzer' | 'results' | 'best') => void
}

function getVideoId(ad: AdDataItem): string {
  return ad["Video ID"] || ad["video_id"] || ""
}

function getAdName(ad: AdDataItem): string {
  return ad["Ad Name"] || ad["ad_name"] || "Unknown Ad"
}

export default function VideoAnalyzerPanelUser({ adData, activeTab, onTabChange }: VideoAnalyzerPanelProps) {
  const [numFrames, setNumFrames] = useState(5)
const {
  isAnalyzing,
  progress,
  currentVideo,
  userResults,  // ✅ USE THIS INSTEAD
  errors,
  bestVideos,
  selectedVideoId,
  analyzeVideos,
  findBestVideos,
  clearResults,
  setSelectedVideoId
} = useVideoAnalysisStore()

const results = userResults

  const handleAnalyze = async () => {
    const videos: VideoForAnalysis[] = adData
      .filter(ad => getVideoId(ad))
      .map(ad => {
        const videoId = getVideoId(ad)
        return {
          video_id: videoId,
          ad_name: getAdName(ad),
          video_url: `https://www.facebook.com/reel/${videoId}`,
          ad_data: ad
        }
      })
    await analyzeVideos(videos, numFrames)
    onTabChange('results')
  }

  const handleFindBest = async () => {
    await findBestVideos()
    onTabChange('best')
  }

  const handleExportJSON = () => {
    const exportData = {
      results,
      bestVideos,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video-analysis-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (results.length === 0) return
    
    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {}
      for (const key in obj) {
        const newKey = prefix ? `${prefix}_${key}` : key
        const value = obj[key]
        
        if (value === null || value === undefined) {
          result[newKey] = ''
        } else if (Array.isArray(value)) {
          // Handle arrays - check if items are objects
          if (value.length > 0 && typeof value[0] === 'object') {
            // For array of objects (like segments), convert to readable format
            if (key === 'segments') {
              // Special handling for transcript segments: "[0.0s] text; [1.5s] more text"
              result[newKey] = value.map((seg: any) => 
                `[${seg.start?.toFixed(1) || 0}s] ${seg.text || ''}`
              ).join('; ')
            } else {
              // Generic object array: JSON stringify
              result[newKey] = JSON.stringify(value)
            }
          } else {
            // Array of primitives
            result[newKey] = value.join('; ')
          }
        } else if (typeof value === 'object') {
          // Recursively flatten nested objects
          Object.assign(result, flattenObject(value, newKey))
        } else {
          result[newKey] = value
        }
      }
      return result
    }
    
    const allKeys = new Set<string>(['video_id', 'ad_name', 'model'])
    const flatResults = results.map(result => {
      const flat: Record<string, any> = {
        video_id: result.video_id,
        ad_name: result.ad_name || '',
        model: result.model || ''
      }
      if (result.analysis) {
        const flatAnalysis = flattenObject(result.analysis)
        Object.keys(flatAnalysis).forEach(k => allKeys.add(k))
        Object.assign(flat, flatAnalysis)
      }
      if (result.video_info) {
        const flatInfo = flattenObject(result.video_info, 'video')
        Object.keys(flatInfo).forEach(k => allKeys.add(k))
        Object.assign(flat, flatInfo)
      }
      return flat
    })
    
    const headers = Array.from(allKeys)
    const rows: string[] = [headers.join(',')]
    
    flatResults.forEach(flat => {
      const row = headers.map(h => {
        const val = flat[h]
        if (val === undefined || val === null) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      rows.push(row.join(','))
    })
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video-analysis-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedResult = results.find(r => r.video_id === selectedVideoId)

 // Analyzer Tab
if (activeTab === 'analyzer') {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Batch Video Analysis</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Analyze all {adData.length} videos from your ad data using AI. Select a model and configure the analysis settings below.
        </p>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">AI Model</label>
            <ModelSelector />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Frames to Analyze</label>
            <select
              value={numFrames}
              onChange={(e) => setNumFrames(Number(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={isAnalyzing}
            >
              <option value={3}>3 frames (faster)</option>
              <option value={5}>5 frames (balanced)</option>
              <option value={10}>10 frames (detailed)</option>
            </select>
          </div>
        </div>

        {/* Videos List */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Videos to Analyze</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {adData.filter(ad => getVideoId(ad)).map((ad, index) => (
              <div key={`video-${index}-${getVideoId(ad)}`} className="bg-white rounded-lg px-3 py-2 text-sm border border-gray-200">
                <div className="font-medium text-gray-900 truncate">{getAdName(ad)}</div>
                <div className="text-gray-500 text-xs mt-0.5">ID: {getVideoId(ad)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {isAnalyzing ? (
          <AnalysisProgress progress={progress} currentVideo={currentVideo} />
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              Analyze All Videos
            </button>
            {results.length > 0 && (
              <button
                onClick={clearResults}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Clear Results
              </button>
            )}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <h4 className="text-red-800 font-medium mb-2 text-sm sm:text-base">Errors ({errors.length})</h4>
            <ul className="text-xs sm:text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {errors.map((err, i) => (
                <li key={i} className="break-words">{err.ad_name || err.video_id}: {err.error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// Results Tab
if (activeTab === 'results') {
  return (
    <div className="space-y-4 sm:space-y-6">
      {selectedResult ? (
        <AnalysisDetails
          result={selectedResult}
          onClose={() => setSelectedVideoId(null)}
        />
      ) : (
        <>
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Analysis Results</h2>
            {results.length > 0 && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={handleFindBest}
                  className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Find Best Videos</span>
                  <span className="sm:hidden">Find Best</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  JSON
                </button>
              </div>
            )}
          </div>

          {/* Results Grid or Empty State */}
          {results.length === 0 ? (
            <div className="bg-white rounded-lg p-8 sm:p-12 text-center border border-gray-200 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                No analysis results yet. Go to Batch Analysis to analyze your videos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {results.map((result) => (
                <VideoCard
                  key={result.video_id}
                  result={result}
                  onClick={() => setSelectedVideoId(result.video_id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Best Videos Tab
if (activeTab === 'best') {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Best Performing Videos</h2>
        {results.length > 0 && !bestVideos && (
          <button
            onClick={handleFindBest}
            className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Best Videos
          </button>
        )}
      </div>

      {/* Content */}
      {bestVideos ? (
        <BestVideosCard bestVideos={bestVideos} />
      ) : results.length === 0 ? (
        <div className="bg-white rounded-lg p-8 sm:p-12 text-center border border-gray-200 shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Analyze videos first to get AI recommendations on best performing videos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 sm:p-12 text-center border border-gray-200 shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Ready to Find Best Videos</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
            Click "Analyze Best Videos" to get AI-powered recommendations.
          </p>
          <button
            onClick={handleFindBest}
            className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Best Videos
          </button>
        </div>
      )}
    </div>
  )
}

return null
}
