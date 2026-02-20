import { Loader2 } from 'lucide-react'

interface AnalysisProgressProps {
  progress: number
  currentVideo: string
}

export default function AnalysisProgress({ progress, currentVideo }: AnalysisProgressProps) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="font-medium">Analyzing videos...</span>
      </div>
      <div className="mb-2">
        <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-gray-400">{currentVideo}</p>
    </div>
  )
}
