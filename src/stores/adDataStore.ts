// src/stores/adDataStore.ts
import { create } from 'zustand'
import type { AdData } from '@/lib/types'

interface AdDataStore {
  adData: AdData[]
  setAdData: (data: AdData[]) => void
  clearAdData: () => void
}

export const useAdDataStore = create<AdDataStore>((set) => ({
  adData: [],
  setAdData: (data) => set({ adData: data }),
  clearAdData: () => set({ adData: [] }),
}))