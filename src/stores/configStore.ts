// === src/stores/configStore.ts (ADD adsData to store) ===
import { create } from 'zustand'
import type { Config, AdData, ReviewData } from '@/lib/types'
import { DEFAULT_CONFIG } from '@/lib/constants'

interface ConfigStore {
  config: Config
  adsData: AdData[]
  reviewsData: ReviewData[]
  updateConfig: (updates: Partial<Config>) => void
  setIsConfigured: (value: boolean) => void
  setAdsData: (data: AdData[]) => void
  setReviewsData: (data: ReviewData[]) => void
  resetConfig: () => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  adsData: [],
  reviewsData: [],
  
  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates }
    })),
  
  setIsConfigured: (value) =>
    set((state) => ({
      config: { ...state.config, isConfigured: value }
    })),

  setAdsData: (data) => set({ adsData: data }),
  
  setReviewsData: (data) => set({ reviewsData: data }),
  
  resetConfig: () => set({ 
    config: DEFAULT_CONFIG,
    adsData: [],
    reviewsData: []
  }),
}))