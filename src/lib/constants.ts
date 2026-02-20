// === src/lib/constants.ts ===
/**
 * Application constants and configuration
 */
import type { Config } from './types'

export const DEFAULT_CONFIG: Config = {
  n8nWebhookUrl: 'https://n8n.scalexagent.cloud/webhook/facebook-ads-analyzer',
  facebookToken: '', // Will be loaded from Firestore
  adAccountId: '',
  openaiKey: '',
  targetCpa: 0,
  totalBudget: 0,
  isConfigured: false,
}

export const TABS = [
  { id: 'ads-performance', label: 'Ad Performance', icon: 'BarChart3' },
  { id: 'agent-reviews', label: 'Agent Reviews', icon: 'Users' },
  { id: 'chatbot', label: 'Chat Bot', icon: 'MessageSquare' },
] as const

export const STATUS_TYPES = {
  N8N: 'n8n-status',
  FACEBOOK: 'facebook-status',
  OPENAI: 'openai-status',
  ANALYSIS: 'analysis-status',
} as const