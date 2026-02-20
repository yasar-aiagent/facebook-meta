import { AnalysisResult } from '../../../../types/videoAnalysis'
import { X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface AnalysisDetailsProps {
  result: AnalysisResult
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  actor_human_elements: 'Actor & Human Elements',
  color_visual_style: 'Color & Visual Style',
  video_production: 'Video Production',
  text_typography: 'Text & Typography',
  branding_logo: 'Branding & Logo',
  call_to_action: 'Call-to-Action',
  audio_elements: 'Audio Elements',
  script_analysis: 'Script Analysis',
  content_messaging: 'Content & Messaging',
  engagement_elements: 'Engagement Elements',
  platform_optimization: 'Platform Optimization',
}

export default function AnalysisDetails({ result, onClose }: AnalysisDetailsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['overall_assessment'])
  const assessment = result.analysis?.overall_assessment
  const technical = result.analysis?.technical_metrics

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

// Render Metric Value - Updated Colors
const renderMetricValue = (value: any) => {
  if (typeof value === 'number') {
    const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'
    return <span className={`font-medium ${color}`}>{value}</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside text-gray-700 text-xs sm:text-sm space-y-1">
        {value.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    )
  }
  return <span className="text-gray-700 text-sm">{String(value)}</span>
}


// Main Component
return (
  <div className="space-y-4 sm:space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{result.ad_name}</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Video ID: {result.video_id}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <a
          href={result.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm flex-1 sm:flex-initial"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>View Video</span>
        </a>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
      </div>
    </div>

    {/* Technical Metrics */}
    {technical && (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
        <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">Technical Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Duration</div>
            <div className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{technical.video_duration_seconds}s</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Frame Rate</div>
            <div className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{technical.frame_rate} fps</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Resolution</div>
            <div className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{technical.resolution}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Total Frames</div>
            <div className="text-sm sm:text-base font-semibold text-gray-900 mt-1">{technical.total_frames}</div>
          </div>
        </div>
      </div>
    )}

    {/* Audio Transcript */}
    {result.analysis?.audio_transcript && (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleCategory('audio_transcript')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 flex items-center gap-2">
            <span className="text-lg sm:text-xl">🎤</span> 
            <span className="hidden sm:inline">Video Script / Audio Transcript</span>
            <span className="sm:hidden">Audio Transcript</span>
          </h3>
          {expandedCategories.includes('audio_transcript') ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          )}
        </button>
        {expandedCategories.includes('audio_transcript') && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-200">
            <div className="py-3 sm:py-4">
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">Language: </span>
                  <span className="text-gray-900 font-medium">{result.analysis.audio_transcript.language || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration: </span>
                  <span className="text-gray-900 font-medium">{result.analysis.audio_transcript.duration?.toFixed(1) || 0}s</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase mb-2 font-medium">Full Transcript</div>
                <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                  {result.analysis.audio_transcript.transcript || 'No speech detected'}
                </p>
              </div>
              {result.analysis.audio_transcript.segments && result.analysis.audio_transcript.segments.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <div className="text-xs text-gray-600 uppercase mb-2 font-medium">Timed Segments</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {result.analysis.audio_transcript.segments.map((seg: any, i: number) => (
                      <div key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                        <span className="text-indigo-600 font-medium shrink-0">[{seg.start?.toFixed(1)}s]</span>
                        <span className="text-gray-700">{seg.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Overall Assessment */}
    {assessment && (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleCategory('overall_assessment')}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Overall Assessment</h3>
          {expandedCategories.includes('overall_assessment') ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          )}
        </button>
        {expandedCategories.includes('overall_assessment') && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-200">
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Target Audience</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{assessment.estimated_target_audience || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Age Range</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{assessment.target_age_range || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Ad Objective</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{assessment.ad_objective_guess || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Funnel Stage</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{assessment.funnel_stage || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Industry</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{assessment.industry_category || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 uppercase font-medium">Performance Tier</div>
                <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{assessment.estimated_performance_tier || 'N/A'}</div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 py-3 sm:py-4 border-t border-gray-200">
              <ScoreCard label="Creative Quality" score={assessment.creative_quality_score} />
              <ScoreCard label="Engagement" score={assessment.engagement_potential} />
              <ScoreCard label="Conversion" score={assessment.conversion_potential} />
              <ScoreCard label="Professionalism" score={assessment.professionalism_score} />
              <ScoreCard label="Uniqueness" score={assessment.uniqueness_score} />
              <ScoreCard label="Trend Alignment" score={assessment.trend_alignment} />
              <ScoreCard label="Brand Safety" score={assessment.brand_safety_score} />
              <ScoreCard label="Compliance" score={assessment.compliance_score} />
            </div>

            {/* Key Strengths */}
            {assessment.key_strengths && assessment.key_strengths.length > 0 && (
              <div className="py-3 sm:py-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 uppercase mb-2 font-medium">Key Strengths</div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {assessment.key_strengths.map((s, i) => (
                    <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium border border-green-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {assessment.areas_for_improvement && assessment.areas_for_improvement.length > 0 && (
              <div className="py-3 sm:py-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 uppercase mb-2 font-medium">Areas for Improvement</div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {assessment.areas_for_improvement.map((s, i) => (
                    <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-medium border border-yellow-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Optimizations */}
            {assessment.recommended_optimizations && assessment.recommended_optimizations.length > 0 && (
              <div className="py-3 sm:py-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 uppercase mb-2 font-medium">Recommended Optimizations</div>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5">
                  {assessment.recommended_optimizations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold mt-0.5">•</span>
                      <span className="flex-1">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )}

    {/* Other Categories */}
    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
      const data = result.analysis?.[key as keyof typeof result.analysis]
      if (!data || typeof data !== 'object') return null

      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={() => toggleCategory(key)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">{label}</h3>
            {expandedCategories.includes(key) ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            )}
          </button>
          {expandedCategories.includes(key) && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 py-3 sm:py-4">
                {Object.entries(data as Record<string, any>).map(([metricKey, value]) => (
                  <div key={metricKey} className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-600 font-medium capitalize">
                      {metricKey.replace(/_/g, ' ')}
                    </span>
                    {renderMetricValue(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    })}
  </div>
)
}

// ScoreCard Component - Updated Colors
function ScoreCard({ label, score }: { label: string; score?: number }) {
  if (score === undefined) return null
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const bgColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div>
      <div className="text-xs text-gray-600 mb-1 font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <span className={`text-base sm:text-lg font-bold ${color}`}>{score}</span>
        <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${bgColor} transition-all duration-300`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  )
}