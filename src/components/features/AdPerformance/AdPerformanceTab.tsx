// === src/components/features/AdPerformance/AdPerformanceTab.tsx (FORCE RE-RENDER) ===
import React, { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { AdPerformanceTable } from './AdPerformanceTable'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useConfigStore } from '@/stores/configStore'

export function AdPerformanceTab() {
  const { adsData, isLoading, error } = useAnalysis()
  const storeAdsData = useConfigStore((state) => state.adsData)
  const [forceRender, setForceRender] = useState(0)

  // Use store data as fallback
  const dataToDisplay = adsData?.length > 0 ? adsData : storeAdsData

  // Force re-render when store data changes
  useEffect(() => {
    if (storeAdsData?.length > 0) {
      console.log('🔄 Store data changed, forcing re-render:', storeAdsData.length)
      setForceRender(prev => prev + 1)
    }
  }, [storeAdsData])

  console.log('🔍 AdPerformanceTab render:', {
    adsData: adsData?.length || 0,
    storeAdsData: storeAdsData?.length || 0,
    dataToDisplay: dataToDisplay?.length || 0,
    forceRender,
    isLoading,
    error
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading ad performance data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <BarChart3 className="w-16 h-16 text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Ad Performance Overview ({dataToDisplay?.length || 0} ads)
          </h3>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="bg-blue-100 p-4 rounded text-sm hidden">
        <strong>DEBUG - Render #{forceRender}:</strong>
        <ul className="mt-2 space-y-1">
          <li>• Hook adsData: {adsData?.length || 0} items</li>
          <li>• Store adsData: {storeAdsData?.length || 0} items</li>
          <li>• Displaying: {dataToDisplay?.length || 0} items</li>
          <li>• Loading: {isLoading ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <AdPerformanceTable data={dataToDisplay || []} />
    </div>
  )
}