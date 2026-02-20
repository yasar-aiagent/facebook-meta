import os
import tempfile
import shutil
import asyncio
import time
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore

from server.analysis.video_analyzer import (
    download_video_from_url,
    analyze_video,
    get_best_videos
)
from server.analysis.prompts import METRIC_CATEGORIES

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
    except ValueError:
        # Option 1: Using service account JSON file
        cred_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH', 'serviceAccountKey.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized with service account")
        else:
            # Option 2: Using environment variables from your config.ts
            # You can set these in your .env file
            project_id = os.environ.get('VITE_FIREBASE_PROJECT_ID')
            
            if project_id:
                # Initialize with application default credentials
                # This works if you have GOOGLE_APPLICATION_CREDENTIALS set
                # or if running on Google Cloud
                try:
                    firebase_admin.initialize_app(options={
                        'projectId': project_id,
                    })
                    print("✅ Firebase initialized with project ID")
                except Exception as e:
                    print(f"⚠️ Firebase initialization failed: {e}")
                    print("   Please provide serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS")
            else:
                print("⚠️ Firebase credentials not found. API key fetching may fail.")
                print("   Please provide serviceAccountKey.json or set environment variables")

# Initialize Firebase on startup
initialize_firebase()
db = firestore.client()

# Cache for API keys (to avoid repeated Firestore reads)
api_key_cache = {
    "openai": None,
    "claude": None,
    "gemini": None,
    "last_updated": 0
}
CACHE_DURATION = 300  # 5 minutes

async def get_api_keys_from_firestore():
    """Fetch API keys from Firestore with caching"""
    current_time = time.time()
    
    # Return cached keys if still valid
    if current_time - api_key_cache["last_updated"] < CACHE_DURATION:
        if any([api_key_cache["openai"], api_key_cache["claude"], api_key_cache["gemini"]]):
            print("📦 Using cached API keys")
            return {
                "openai": api_key_cache["openai"] or "",
                "anthropic": api_key_cache["claude"] or "",
                "google": api_key_cache["gemini"] or "",
            }
    
    print("🔄 Fetching API keys from Firestore...")
    api_keys = {
        "openai": "",
        "anthropic": "",
        "google": "",
    }
    
    try:
        # Fetch OpenAI key
        try:
            openai_doc = db.collection('config').document('openai').get()
            if openai_doc.exists:
                api_keys["openai"] = openai_doc.to_dict().get('apiKey', '')
                api_key_cache["openai"] = api_keys["openai"]
                print("✅ OpenAI key loaded")
        except Exception as e:
            print(f"⚠️ Error fetching OpenAI key: {e}")
        
        # Fetch Claude key
        try:
            claude_doc = db.collection('config').document('claude').get()
            if claude_doc.exists:
                api_keys["anthropic"] = claude_doc.to_dict().get('apiKey', '')
                api_key_cache["claude"] = api_keys["anthropic"]
                print("✅ Claude key loaded")
        except Exception as e:
            print(f"⚠️ Error fetching Claude key: {e}")
        
        # Fetch Gemini key
        try:
            gemini_doc = db.collection('config').document('gemini').get()
            if gemini_doc.exists:
                api_keys["google"] = gemini_doc.to_dict().get('apiKey', '')
                api_key_cache["gemini"] = api_keys["google"]
                print("✅ Gemini key loaded")
        except Exception as e:
            print(f"⚠️ Error fetching Gemini key: {e}")
        
        # Update cache timestamp
        api_key_cache["last_updated"] = current_time
        
    except Exception as e:
        print(f"❌ Error fetching API keys from Firestore: {e}")
        # Fallback to environment variables
        print("🔄 Falling back to environment variables...")
        api_keys = {
            "openai": os.environ.get("OPENAI_API_KEY", ""),
            "anthropic": os.environ.get("ANTHROPIC_API_KEY", ""),
            "google": os.environ.get("GOOGLE_API_KEY", ""),
        }
    
    return api_keys

app = FastAPI(title="Video Ad Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoUrlRequest(BaseModel):
    url: str

class AnalysisRequest(BaseModel):
    video_path: str
    model: str = "openai"
    num_frames: int = 3

class BatchAnalysisRequest(BaseModel):
    videos: List[dict]
    model: str = "openai"
    num_frames: int = 3

class BestVideosRequest(BaseModel):
    analyses: List[dict]
    model: str = "openai"

AVAILABLE_MODELS = [
    {"id": "openai", "name": "OpenAI GPT-4o-mini", "env_key": "OPENAI_API_KEY"},
    {"id": "claude", "name": "Claude Sonnet", "env_key": "ANTHROPIC_API_KEY"},
    {"id": "gemini", "name": "Google Gemini", "env_key": "GOOGLE_API_KEY"},
]

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/models")
async def get_models():
    api_keys = await get_api_keys_from_firestore()
    
    models = []
    for m in AVAILABLE_MODELS:
        # Map model ID to API key
        key_mapping = {
            "openai": api_keys.get("openai", ""),
            "claude": api_keys.get("anthropic", ""),
            "gemini": api_keys.get("google", ""),
        }
        api_key = key_mapping.get(m["id"], "")
        
        models.append({
            "id": m["id"],
            "name": m["name"],
            "enabled": bool(api_key),
            "hasApiKey": bool(api_key)
        })
    return {"models": models}

@app.get("/api/metrics/categories")
async def get_metric_categories():
    return {"categories": METRIC_CATEGORIES}

@app.post("/api/videos/download")
async def download_video(request: VideoUrlRequest):
    video_path, error = download_video_from_url(request.url)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"video_path": video_path, "success": True}

@app.post("/api/videos/upload")
async def upload_video(file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(file.filename)[1] if file.filename else '.mp4'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            return {"video_path": tmp_file.name, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis/run")
async def run_analysis(
    video_path: str = Form(...),
    model: str = Form("openai"),
    num_frames: int = Form(3)
):
    api_keys = await get_api_keys_from_firestore()
    
    try:
        result = analyze_video(video_path, model, api_keys, num_frames)
        return {"success": True, "analysis": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis/batch")
async def run_batch_analysis(request: BatchAnalysisRequest):
    from concurrent.futures import ThreadPoolExecutor
    
    api_keys = await get_api_keys_from_firestore()
    
    async def process_video_async(video, retry_count=0):
        """Process video in thread pool with retry logic"""
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(executor, process_video, video, retry_count)
            
            # If rate limited, wait and retry
            if result["type"] == "rate_limited" and retry_count < 3:
                wait_time = result.get("wait_time", 3)
                print(f"⏳ Rate limited. Waiting {wait_time}s before retry {retry_count + 1}/3...")
                await asyncio.sleep(wait_time)
                return await process_video_async(video, retry_count + 1)
            
            return result
    
    def process_video(video, retry_count=0):
        video_id = video.get("video_id", "")
        ad_name = video.get("ad_name", "")
        video_url = video.get("video_url", "")
        ad_data = video.get("ad_data", {})
        
        if not video_url:
            if video_id:
                video_url = f"https://www.facebook.com/reel/{video_id}"
            else:
                return {"type": "error", "data": {"video_id": video_id, "error": "No video URL or ID provided"}}
        
        try:
            if retry_count == 0:
                print(f"📹 Analyzing: {ad_name} ({video_id})")
            else:
                print(f"🔄 Retry {retry_count}: {ad_name}")
            
            video_path, download_error = download_video_from_url(video_url)
            if download_error:
                print(f"❌ Download failed: {ad_name} - {download_error}")
                return {"type": "error", "data": {"video_id": video_id, "ad_name": ad_name, "error": download_error}}
            
            analysis = analyze_video(video_path, request.model, api_keys, request.num_frames, ad_data)
            
            result = {
                "video_id": video_id,
                "ad_name": ad_name,
                "video_url": video_url,
                "ad_data": ad_data,
                "analysis": analysis,
                "success": True
            }
            
            if os.path.exists(video_path):
                os.unlink(video_path)
            
            print(f"✅ Completed: {ad_name}")
            return {"type": "result", "data": result}
                
        except Exception as e:
            error_msg = str(e)
            
            # Check if it's a rate limit error
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                # Extract wait time from error message
                wait_time = 3  # default
                if "Please try again in" in error_msg:
                    try:
                        import re
                        match = re.search(r'try again in ([\d.]+)s', error_msg)
                        if match:
                            wait_time = float(match.group(1)) + 0.5  # Add buffer
                    except:
                        pass
                
                print(f"⏳ Rate limit hit for: {ad_name}")
                return {"type": "rate_limited", "wait_time": wait_time, "video": video}
            
            print(f"❌ Error: {ad_name} - {error_msg[:100]}")
            return {"type": "error", "data": {"video_id": video_id, "ad_name": ad_name, "error": error_msg}}
    
    results = []
    errors = []
    
    if not request.videos:
        return {
            "success": True,
            "total": 0,
            "analyzed": 0,
            "failed": 0,
            "results": [],
            "errors": []
        }
    
    # REDUCED batch size to avoid rate limits
    BATCH_SIZE = 3  # Reduced from 6 to 3
    total_videos = len(request.videos)
    
    print(f"\n🚀 Starting batch analysis: {total_videos} videos")
    print(f"📊 Processing {BATCH_SIZE} videos in parallel per batch")
    print(f"⏱️  Adding delays between batches to respect rate limits")
    
    for batch_num, i in enumerate(range(0, total_videos, BATCH_SIZE), 1):
        batch = request.videos[i:i + BATCH_SIZE]
        batch_end = min(i + BATCH_SIZE, total_videos)
        print(f"\n📦 Batch {batch_num}: Processing videos {i+1}-{batch_end}")
        
        # Process batch in parallel with retry logic
        batch_results = await asyncio.gather(*[process_video_async(v) for v in batch])
        
        for item in batch_results:
            if item["type"] == "result":
                results.append(item["data"])
            elif item["type"] == "error":
                errors.append(item["data"])
            # rate_limited items are already retried
        
        succeeded = len([r for r in batch_results if r['type'] == 'result'])
        print(f"   ✓ Batch {batch_num} complete: {succeeded} succeeded")
        
        # Add delay between batches to avoid rate limits
        if i + BATCH_SIZE < total_videos:
            delay = 5  # 5 seconds between batches
            print(f"   ⏳ Waiting {delay}s before next batch...")
            await asyncio.sleep(delay)
    
    print(f"\n🎉 Analysis complete: {len(results)} successful, {len(errors)} failed")
    
    return {
        "success": True,
        "total": len(request.videos),
        "analyzed": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }

@app.post("/api/analysis/best-videos")
async def find_best_videos(request: BestVideosRequest):
    api_keys = await get_api_keys_from_firestore()
    
    try:
        result = get_best_videos(request.analyses, request.model, api_keys)
        return {"success": True, "best_videos": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/videos/cleanup")
async def cleanup_video(video_path: str):
    try:
        if os.path.exists(video_path):
            os.unlink(video_path)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)