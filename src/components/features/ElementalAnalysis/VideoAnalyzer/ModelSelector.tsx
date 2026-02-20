import { useVideoAnalysisStore } from '../../../../stores/videoAnalysisStore'

export default function ModelSelector() {
  const { models, selectedModel, setSelectedModel, isAnalyzing } = useVideoAnalysisStore()

  return (
    <select
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      disabled={isAnalyzing}
    >
      {models.map((model) => (
        <option key={model.id} value={model.id} disabled={!model.enabled}>
          {model.name} {!model.enabled && '(No API Key)'}
        </option>
      ))}
      {models.length === 0 && (
        <option value="openai">OpenAI GPT-4o</option>
      )}
    </select>
  )
}
