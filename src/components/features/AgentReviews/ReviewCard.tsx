// === src/components/features/AgentReviews/ReviewCard.tsx (COMPLETE) ===
import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp, Trophy, AlertCircle, TrendingUp, Target, DollarSign, Eye } from 'lucide-react'
import type { ReviewData } from '@/lib/types'

interface ReviewCardProps {
  review: ReviewData
  index: number
}

export function ReviewCard({ review, index }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const content = review.message?.content || review.content || 'No content available'
  
  // Parse the review content to extract key information
  const parseReview = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    
    // Extract title and type
    const titleMatch = content.match(/🏆 (.*?)=+/g)
    const title = titleMatch ? titleMatch[0].replace(/🏆|=/g, '').trim() : `Performance Review #${index}`
    
    // Determine review type and severity
    let type = 'general'
    let severity = 'medium'
    let icon = TrendingUp
    
    if (content.includes('🏆') || content.includes('TOP PERFORMING')) {
      type = 'top_performer'
      severity = 'low'
      icon = Trophy
    } else if (content.includes('⚠️') || content.includes('UNDERPERFORM')) {
      type = 'warning'
      severity = 'high'
      icon = AlertCircle
    } else if (content.includes('SCALE') || content.includes('OPTIMIZE')) {
      type = 'recommendation'
      severity = 'medium'
      icon = Target
    }

    // Extract key metrics
    const metrics = {
      adId: extractValue(content, /Ad ID:\s*([^\n]+)/),
      adName: extractValue(content, /Ad Name:\s*([^\n]+)/),
      campaign: extractValue(content, /Campaign:\s*([^\n]+)/),
      spend: extractValue(content, /Ad Spend:\s*₹([^\n\s]+)/),
      conversions: extractValue(content, /Conversions:\s*(\d+)/),
      cpa: extractValue(content, /CPA:\s*₹([^\n\s]+)/),
      cpc: extractValue(content, /CPC:\s*₹([^\n\s]+)/),
      impressions: extractValue(content, /Impressions:\s*([^\n\s,]+)/),
      clicks: extractValue(content, /Clicks:\s*(\d+)/)
    }

    return { title, type, severity, icon, metrics, lines }
  }

  const extractValue = (text: string, regex: RegExp): string => {
    const match = text.match(regex)
    return match ? match[1] : ''
  }

  const { title, type, severity, icon: IconComponent, metrics, lines } = parseReview(content)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-blue-500 bg-blue-50'
    }
  }

  const getSeverityBadge = (severity: string, type: string) => {
    if (type === 'top_performer') return <Badge variant="success">Top Performer</Badge>
    if (type === 'warning') return <Badge variant="error">Needs Attention</Badge>
    if (type === 'recommendation') return <Badge variant="warning">Recommendation</Badge>
    return <Badge variant="neutral">Review</Badge>
  }

  const formatContent = (content: string) => {
    return content
      // Format headers with icons
      .replace(/🏆 (.*?)=+/g, '<div class="text-lg font-bold text-yellow-600 mb-3 flex items-center gap-2">🏆 $1</div>')
      .replace(/✅ QUALIFIED TOP PERFORMER/g, '<div class="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">✅ Qualified Top Performer</div>')
      .replace(/⚠️ (.*)/g, '<div class="text-orange-600 font-semibold mb-2">⚠️ $1</div>')
      
      // Format sections
      .replace(/Financial Performance:/g, '<h4 class="text-md font-semibold text-gray-800 mb-2 mt-4 flex items-center gap-2"><span class="w-4 h-4 bg-green-500 rounded-full"></span>Financial Performance:</h4>')
      .replace(/Key Metrics:/g, '<h4 class="text-md font-semibold text-gray-800 mb-2 mt-4 flex items-center gap-2"><span class="w-4 h-4 bg-blue-500 rounded-full"></span>Key Metrics:</h4>')
      .replace(/Qualification Check:/g, '<h4 class="text-md font-semibold text-gray-800 mb-2 mt-4 flex items-center gap-2"><span class="w-4 h-4 bg-purple-500 rounded-full"></span>Qualification Check:</h4>')
      .replace(/Recommendation:/g, '<h4 class="text-md font-semibold text-gray-800 mb-2 mt-4 flex items-center gap-2"><span class="w-4 h-4 bg-orange-500 rounded-full"></span>Recommendation:</h4>')
      
      // Format metrics with better styling
      .replace(/- (.*): (₹[\d,\.]+)/g, '<div class="flex justify-between items-center py-1 px-3 bg-gray-50 rounded mb-1"><span class="text-gray-700">$1:</span><span class="font-semibold text-gray-900">$2</span></div>')
      .replace(/- (.*): ([\d,]+)(?!\.)(?!₹)/g, '<div class="flex justify-between items-center py-1 px-3 bg-gray-50 rounded mb-1"><span class="text-gray-700">$1:</span><span class="font-semibold text-gray-900">$2</span></div>')
      .replace(/- (.*): ([^₹\d][^\n]*)/g, '<div class="flex justify-between items-center py-1 px-3 bg-gray-50 rounded mb-1"><span class="text-gray-700">$1:</span><span class="text-gray-900">$2</span></div>')
      
      // Format checkmarks and status indicators
      .replace(/✅ ([^:]+): (.+)/g, '<div class="flex items-center gap-2 py-1"><span class="text-green-500">✅</span><span class="text-gray-700">$1:</span><span class="font-medium text-gray-900">$2</span></div>')
      .replace(/❌ ([^:]+): (.+)/g, '<div class="flex items-center gap-2 py-1"><span class="text-red-500">❌</span><span class="text-gray-700">$1:</span><span class="font-medium text-gray-900">$2</span></div>')
      
      // Format final recommendation with emphasis
      .replace(/SCALE THIS AD - (.+)/g, '<div class="bg-green-100 border border-green-200 rounded-lg p-3 mt-4"><div class="flex items-center gap-2 text-green-800 font-bold text-sm mb-2"><span class="bg-green-500 text-white px-2 py-1 rounded text-xs">ACTION</span>SCALE THIS AD</div><p class="text-green-700 text-sm">$1</p></div>')
      .replace(/PAUSE THIS AD - (.+)/g, '<div class="bg-red-100 border border-red-200 rounded-lg p-3 mt-4"><div class="flex items-center gap-2 text-red-800 font-bold text-sm mb-2"><span class="bg-red-500 text-white px-2 py-1 rounded text-xs">ACTION</span>PAUSE THIS AD</div><p class="text-red-700 text-sm">$1</p></div>')
      .replace(/OPTIMIZE THIS AD - (.+)/g, '<div class="bg-yellow-100 border border-yellow-200 rounded-lg p-3 mt-4"><div class="flex items-center gap-2 text-yellow-800 font-bold text-sm mb-2"><span class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">ACTION</span>OPTIMIZE THIS AD</div><p class="text-yellow-700 text-sm">$1</p></div>')
      
      // Format line breaks
      .replace(/\n/g, '<br>')
  }

  const previewContent = lines.slice(0, 3).join('\n')
  const displayContent = isExpanded ? content : previewContent

  return (
    <Card className={`border-l-4 ${getSeverityColor(severity)} transition-all duration-200`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full flex-shrink-0">
              <IconComponent className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                {getSeverityBadge(severity, type)}
              </div>
              
              {/* Key Metrics Preview */}
              {metrics.adName && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                  <span><strong>Ad:</strong> {metrics.adName}</span>
                  {metrics.spend && <span><strong>Spend:</strong> ₹{metrics.spend}</span>}
                  {metrics.conversions && <span><strong>Conversions:</strong> {metrics.conversions}</span>}
                  {metrics.cpa && <span><strong>CPA:</strong> ₹{metrics.cpa}</span>}
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                More
              </>
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: formatContent(displayContent) 
            }} 
          />
          
          {!isExpanded && lines.length > 3 && (
            <div className="text-gray-500 text-xs mt-2">
              ... and {lines.length - 3} more lines
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 border-t pt-2">
          Generated: {new Date().toLocaleString()}
          {review.message?.role && (
            <span className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
              Role: {review.message.role}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}