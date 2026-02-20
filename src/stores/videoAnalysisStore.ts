import { create } from 'zustand';
import { AIModel, AnalysisResult, BestVideosResult, VideoForAnalysis } from '../types/videoAnalysis';
import { getAvailableModels, runBatchAnalysis, findBestVideos } from '../services/videoAnalysisApi';

interface VideoAnalysisStore {
  isAnalyzing: boolean;
  progress: number;
  currentVideo: string;
  results: AnalysisResult[];
  userResults: AnalysisResult[]; // ✅ User's loaded results
  errors: Array<{ video_id: string; ad_name?: string; error: string }>;
  bestVideos: BestVideosResult | null;
  selectedModel: string;
  models: AIModel[];
  selectedVideoId: string | null;

  setSelectedModel: (model: string) => void;
  setSelectedVideoId: (videoId: string | null) => void;
  setUserResults: (results: AnalysisResult[]) => void;
  setResults: (results: AnalysisResult[]) => void;
  setBestVideos: (bestVideos: BestVideosResult | null) => void;
  loadModels: () => Promise<void>;
  analyzeVideos: (videos: VideoForAnalysis[], numFrames?: number) => Promise<void>;
  findBestVideos: () => Promise<void>;
  clearResults: () => void;
}

export const useVideoAnalysisStore = create<VideoAnalysisStore>((set, get) => ({
  isAnalyzing: false,
  progress: 0,
  currentVideo: '',
  results: [], // Admin results (newly analyzed)
  userResults: [], // User results (loaded from DB)
  errors: [],
  bestVideos: null,
  selectedModel: 'openai',
  models: [],
  selectedVideoId: null,

  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setSelectedVideoId: (videoId) => set({ selectedVideoId: videoId }),
  
  setUserResults: (results: AnalysisResult[]) => {
    set({ userResults: results })
  },
  
  setResults: (results: AnalysisResult[]) => {
    set({ results })
  },

  setBestVideos: (bestVideos: BestVideosResult | null) => {
    set({ bestVideos })
  },

  loadModels: async () => {
    try {
      const models = await getAvailableModels();
      const enabledModel = models.find(m => m.enabled);
      set({ 
        models,
        selectedModel: enabledModel?.id || 'openai'
      });
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  },

  analyzeVideos: async (videos, numFrames = 5) => {
    const { selectedModel } = get();
    
    set({ 
      isAnalyzing: true, 
      progress: 0, 
      results: [], 
      errors: [],
      bestVideos: null,
      currentVideo: 'Starting batch analysis...'
    });

    try {
      const response = await runBatchAnalysis(videos, selectedModel, numFrames);
      
      set({
        isAnalyzing: false,
        progress: 100,
        currentVideo: '',
        results: response.results,
        errors: response.errors
      });
    } catch (error: any) {
      set({
        isAnalyzing: false,
        progress: 0,
        currentVideo: '',
        errors: [{ video_id: 'batch', error: error.message || 'Analysis failed' }]
      });
    }
  },

  // findBestVideos: async () => {
  //   const { results, selectedModel } = get();
    
  //   if (results.length === 0) return;

  //   try {
  //     const analyses = results.map(r => ({
  //       video_id: r.video_id,
  //       ad_name: r.ad_name,
  //       analysis: r.analysis
  //     }));
      
  //     const bestVideos = await findBestVideos(analyses, selectedModel);
  //     set({ bestVideos });
  //   } catch (error: any) {
  //     console.error('Failed to find best videos:', error);
  //   }
  // }
  
  findBestVideos: async () => {
  const { results, selectedModel } = get();
  
  if (results.length === 0) return;

  try {
    console.log(`🔍 Analyzing ${results.length} videos for scores > 70%...`)
    
    // Step 1: Calculate scores on frontend first
    const scoredVideos = results
      .map(result => {
        const assessment = result.analysis?.overall_assessment
        if (!assessment) return null

        const creative = assessment.creative_quality_score || 0
        const engagement = assessment.engagement_potential || 0
        const conversion = assessment.conversion_potential || 0
        const overallScore = Math.round((creative + engagement + conversion) / 3)

        return {
          video_id: result.video_id,
          ad_name: result.ad_name,
          overall_score: overallScore,
          result: result
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null && v.overall_score > 70)
      .sort((a, b) => b.overall_score - a.overall_score)

    console.log(`✅ Found ${scoredVideos.length} videos with score > 70%`)

    // Step 2: If no videos above 70%
    if (scoredVideos.length === 0) {
      console.warn('⚠️ No videos with score > 70%')
      set({ 
        bestVideos: {
          top_videos: [],
          insights: {
            common_success_factors: [],
            recommendations: ['Improve video quality to achieve scores above 70%'],
            average_score: 0,
            total_high_performers: 0,
            threshold: 70
          }
        }
      })
      return
    }

    // Step 3: Prepare analyses for backend (all videos > 70%)
    const analyses = scoredVideos.map(v => ({
      video_id: v.video_id,
      ad_name: v.ad_name,
      analysis: v.result.analysis
    }))

    console.log(`📤 Sending ${analyses.length} videos to backend...`)
    
    // Step 4: Call backend API (your existing findBestVideos function)
    const bestVideos = await findBestVideos(analyses, selectedModel)
    
    console.log(`✅ Analysis complete: ${bestVideos.top_videos?.length || 0} videos`)
    
    set({ bestVideos })

  } catch (error: any) {
    console.error('❌ Failed to find best videos:', error)
    
    // Fallback: Create result without backend
    const scoredVideos = results
      .map(result => {
        const assessment = result.analysis?.overall_assessment
        if (!assessment) return null

        const creative = assessment.creative_quality_score || 0
        const engagement = assessment.engagement_potential || 0
        const conversion = assessment.conversion_potential || 0
        const overallScore = Math.round((creative + engagement + conversion) / 3)

        if (overallScore <= 70) return null

        return {
          rank: 0,
          video_id: result.video_id,
          ad_name: result.ad_name,
          overall_score: overallScore,
          key_strengths: ['High overall score', 'Strong metrics'],
          why_its_best: `Performance score: ${overallScore}%`,
          metrics_summary: {
            creative_quality: creative,
            engagement_potential: engagement,
            conversion_potential: conversion,
            hook_strength: result.analysis?.content_messaging?.hook_strength || 'N/A',
            scroll_stopping_power: result.analysis?.engagement_elements?.scroll_stopping_power || 0
          }
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => b.overall_score - a.overall_score)
      .map((v, i) => ({ ...v, rank: i + 1 }))

    const avgScore = scoredVideos.length > 0 
      ? scoredVideos.reduce((sum, v) => sum + v.overall_score, 0) / scoredVideos.length 
      : 0

    set({ 
      bestVideos: {
        top_videos: scoredVideos,
        insights: {
          common_success_factors: ['High quality scores'],
          recommendations: ['Continue similar approach'],
          average_score: Math.round(avgScore * 10) / 10,
          total_high_performers: scoredVideos.length,
          threshold: 70
        }
      }
    })
  }
},

  clearResults: () => set({
    results: [],
    errors: [],
    bestVideos: null,
    progress: 0,
    currentVideo: '',
    selectedVideoId: null
  })
}));