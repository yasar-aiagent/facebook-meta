export interface AdData {
  [key: string]: string | number | boolean;
}

export interface VideoForAnalysis {
  video_id: string;
  ad_name: string;
  video_url: string;
  ad_data?: Record<string, any>;
}

export interface AIModel {
  id: string;
  name: string;
  enabled: boolean;
  hasApiKey: boolean;
}

export interface AnalysisResult {
  video_id: string;
  ad_name: string;
  video_url: string;
  analysis: VideoAnalysis;
  success: boolean;
}

export interface VideoAnalysis {
  actor_human_elements?: Record<string, number | string>;
  color_visual_style?: Record<string, number | string>;
  video_production?: Record<string, number | string>;
  text_typography?: Record<string, number | string>;
  branding_logo?: Record<string, number | string>;
  call_to_action?: Record<string, number | string>;
  audio_elements?: Record<string, number | string>;
  content_messaging?: Record<string, number | string>;
  engagement_elements?: Record<string, number | string>;
  platform_optimization?: Record<string, number | string>;
  overall_assessment?: OverallAssessment;
  technical_metrics?: TechnicalMetrics;
}

export interface OverallAssessment {
  estimated_target_audience?: string;
  target_age_range?: string;
  target_gender?: string;
  ad_objective_guess?: string;
  funnel_stage?: string;
  industry_category?: string;
  creative_quality_score?: number;
  engagement_potential?: number;
  conversion_potential?: number;
  professionalism_score?: number;
  uniqueness_score?: number;
  trend_alignment?: number;
  brand_safety_score?: number;
  compliance_score?: number;
  key_strengths?: string[];
  areas_for_improvement?: string[];
  similar_ad_style?: string;
  recommended_optimizations?: string[];
  estimated_performance_tier?: string;
}

export interface TechnicalMetrics {
  video_duration_seconds: number;
  frame_rate: number;
  resolution: string;
  total_frames: number;
}

export interface BatchAnalysisResponse {
  success: boolean;
  total: number;
  analyzed: number;
  failed: number;
  results: AnalysisResult[];
  errors: Array<{ video_id: string; ad_name?: string; error: string }>;
}

export interface BestVideosResult {
  top_videos: Array<{
    rank: number;
    video_id: string;
    ad_name: string;
    overall_score: number;
    key_strengths: string[];
    why_its_best: string;
    metrics_summary: {
      creative_quality: number;
      engagement_potential: number;
      conversion_potential: number;
      hook_strength: string;
      scroll_stopping_power: number;
    };
  }>;
  insights: {
    common_success_factors: string[];
    recommendations: string[];
  };
}

export interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentVideo: string;
  results: AnalysisResult[];
  errors: Array<{ video_id: string; error: string }>;
  bestVideos: BestVideosResult | null;
  selectedModel: string;
  models: AIModel[];
}
