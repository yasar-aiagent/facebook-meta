import { BestVideosResult } from '../../../../types/videoAnalysis'
import { Trophy, Star, TrendingUp, Lightbulb } from 'lucide-react'

interface BestVideosCardProps {
  bestVideos: BestVideosResult
}

export default function BestVideosCard({ bestVideos }: BestVideosCardProps) {
  // Helper function for medal colors
  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
      default:
        return 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Videos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {bestVideos.top_videos.map((video) => (
          <div
            key={video.video_id}
            className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header with Rank and Score */}
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getMedalColor(video.rank)}`}>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-500">Rank #{video.rank}</div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{video.ad_name}</h3>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-green-600 flex-shrink-0">{video.overall_score}</div>
            </div>

            {/* Why It's Best */}
            <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 line-clamp-3">{video.why_its_best}</p>

            {/* Metrics Summary */}
            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Creative Quality</span>
                <span className="text-gray-900 font-medium">{video.metrics_summary.creative_quality}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Engagement</span>
                <span className="text-gray-900 font-medium">{video.metrics_summary.engagement_potential}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Conversion</span>
                <span className="text-gray-900 font-medium">{video.metrics_summary.conversion_potential}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Hook Strength</span>
                <span className="text-gray-900 font-medium">{video.metrics_summary.hook_strength}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Scroll-Stopping</span>
                <span className="text-gray-900 font-medium">{video.metrics_summary.scroll_stopping_power}</span>
              </div>
            </div>

            {/* Key Strengths */}
            <div>
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1 font-medium">
                <Star className="w-3 h-3 text-yellow-500" />
                Key Strengths
              </div>
              <div className="flex flex-wrap gap-1.5">
                {video.key_strengths.slice(0, 3).map((strength, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Section */}
      {bestVideos.insights && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            AI Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Common Success Factors */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                Common Success Factors
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {bestVideos.insights.common_success_factors.map((factor, i) => (
                  <li key={i} className="text-xs sm:text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 font-bold">•</span>
                    <span className="flex-1">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-200">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                Recommendations
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {bestVideos.insights.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs sm:text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5 font-bold">•</span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}