// === src/lib/types.ts (UPDATED Config interface) ===
/**
 * Type definitions for the Facebook Ads Analyzer application
 */

export interface Config {
  n8nWebhookUrl: string
  facebookToken: string
  adAccountId: string
  targetCpa: number
  dateFrom: string
  dateTo: string
  funnelType: 'Leads' | 'Sales'
  isConfigured: boolean
}

export interface AdData {
  [key: string]: string | number | boolean
}

export interface ReviewData {
  message: {
    content: string
    role: string
  }
}

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export interface AnalysisResponse {
  status: 'success' | 'error'
  adsData?: AdData[]
  reviewsData?: ReviewData[]
  ai_insights?: string
  error?: string
}

export interface StatusIndicatorProps {
  status: 'online' | 'offline'
  label: string
}