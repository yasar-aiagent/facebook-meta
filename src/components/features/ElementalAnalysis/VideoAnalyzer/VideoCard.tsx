import { AnalysisResult } from '../../../../types/videoAnalysis'
import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

interface VideoCardProps {
  result: AnalysisResult
  onClick: () => void
}

export default function VideoCard({ result, onClick }: VideoCardProps) {
  const assessment = result.analysis?.overall_assessment
  const qualityScore = assessment?.creative_quality_score || 0
  const engagementScore = assessment?.engagement_potential || 0
  const conversionScore = assessment?.conversion_potential || 0

  const avgScore = Math.round((qualityScore + engagementScore + conversionScore) / 3)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
     if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
  }

 return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">{result.ad_name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">ID: {result.video_id}</p>
        </div>
        {result.success ? (
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
        )}
      </div>

      {result.success && assessment && (
        <>
          {/* Overall Score */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Overall Score</div>
          </div>

          {/* Score Bars */}
          <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4">
            {/* Quality Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">Quality</span>
                <span className={`font-semibold ${getScoreColor(qualityScore)}`}>{qualityScore}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getScoreBg(qualityScore)}`} 
                  style={{ width: `${qualityScore}%` }} 
                />
              </div>
            </div>

            {/* Engagement Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">Engagement</span>
                <span className={`font-semibold ${getScoreColor(engagementScore)}`}>{engagementScore}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getScoreBg(engagementScore)}`} 
                  style={{ width: `${engagementScore}%` }} 
                />
              </div>
            </div>

            {/* Conversion Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">Conversion</span>
                <span className={`font-semibold ${getScoreColor(conversionScore)}`}>{conversionScore}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getScoreBg(conversionScore)}`} 
                  style={{ width: `${conversionScore}%` }} 
                />
              </div>
            </div>
          </div>

          {/* View Details Link */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-indigo-600 group-hover:text-indigo-700 font-medium">
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </>
      )}

      {/* Error State */}
      {!result.success && (
        <div className="mt-2">
          <p className="text-xs sm:text-sm text-red-600 bg-red-50 rounded px-2 py-1.5">
            Analysis failed. Click to view details.
          </p>
        </div>
      )}
    </div>
  )

  }

