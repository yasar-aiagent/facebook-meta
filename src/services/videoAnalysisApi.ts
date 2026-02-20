import { AIModel, BatchAnalysisResponse, BestVideosResult, VideoForAnalysis } from '../types/videoAnalysis';

const API_BASE = '/api';

export async function getAvailableModels(): Promise<AIModel[]> {
  const response = await fetch(`${API_BASE}/models`);
  if (!response.ok) {
    throw new Error('Failed to fetch models');
  }
  const data = await response.json();
  return data.models;
}

export async function downloadVideo(url: string): Promise<string> {
  const response = await fetch(`${API_BASE}/videos/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to download video');
  }
  const data = await response.json();
  return data.video_path;
}

export async function runBatchAnalysis(
  videos: VideoForAnalysis[],
  model: string = 'openai',
  numFrames: number = 5
): Promise<BatchAnalysisResponse> {
  const response = await fetch(`${API_BASE}/analysis/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videos,
      model,
      num_frames: numFrames
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Batch analysis failed');
  }
  return await response.json();
}

export async function findBestVideos(
  analyses: Array<{ video_id: string; ad_name: string; analysis: any }>,
  model: string = 'openai'
): Promise<BestVideosResult> {
  const response = await fetch(`${API_BASE}/analysis/best-videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analyses,
      model
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to find best videos');
  }
  const data = await response.json();
  return data.best_videos;
}

export async function getMetricCategories(): Promise<Record<string, string[]>> {
  const response = await fetch(`${API_BASE}/metrics/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch metric categories');
  }
  const data = await response.json();
  return data.categories;
}
