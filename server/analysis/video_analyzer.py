import os
import cv2
import base64
import json
import tempfile
import subprocess
import concurrent.futures
from PIL import Image
import io
import requests
from urllib.parse import urlparse
import yt_dlp
from openai import OpenAI
import anthropic
import google.generativeai as genai
from .prompts import ANALYSIS_PROMPT, BEST_VIDEOS_PROMPT, get_analysis_prompt

def extract_audio(video_path: str) -> str:
    """Extract audio from video file to mp3 for transcription"""
    try:
        audio_path = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3').name
        cmd = [
            'ffmpeg', '-i', video_path, '-vn', '-acodec', 'libmp3lame',
            '-ar', '16000', '-ac', '1', '-b:a', '64k',
            '-y', audio_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=60)
        if result.returncode == 0 and os.path.exists(audio_path) and os.path.getsize(audio_path) > 1000:
            return audio_path
        return None
    except Exception as e:
        print(f"Audio extraction error: {e}")
        return None

def transcribe_audio(audio_path: str, api_key: str) -> dict:
    """Transcribe audio using OpenAI Whisper API"""
    try:
        client = OpenAI(api_key=api_key)
        with open(audio_path, 'rb') as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
        return {
            "transcript": response.text,
            "language": getattr(response, 'language', 'unknown'),
            "duration": getattr(response, 'duration', 0),
            "segments": [{"start": s.start, "end": s.end, "text": s.text} 
                        for s in getattr(response, 'segments', [])]
        }
    except Exception as e:
        print(f"Transcription error: {e}")
        return None
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except:
                pass

def get_video_frames(video_path: str, num_frames: int = 3):  # Changed default from 5 to 3
    frames = []
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    frame_indices = [int(i * total_frames / (num_frames + 1)) for i in range(1, num_frames + 1)]
    
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)
    
    cap.release()
    
    video_info = {
        "duration": duration,
        "fps": fps,
        "total_frames": total_frames,
        "width": width,
        "height": height
    }
    
    return frames, video_info

def frame_to_base64(frame, max_size=640) -> str:  # OPTIMIZED: Added max_size parameter
    """Convert frame to base64 with optional resizing for faster upload"""
    img = Image.fromarray(frame)
    
    # Resize if larger than max_size (speeds up upload and processing)
    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode()

def is_social_media_url(url: str) -> bool:
    social_domains = ['facebook.com', 'fb.com', 'instagram.com', 'tiktok.com', 
                      'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'vimeo.com']
    parsed = urlparse(url)
    return any(domain in parsed.netloc.lower() for domain in social_domains)

def download_video_from_url(url: str) -> tuple:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ['http', 'https']:
            return None, "Invalid URL scheme. Please use http or https."
        
        if is_social_media_url(url):
            return download_with_ytdlp(url)
        
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()
        
        content_type = response.headers.get('content-type', '')
        if 'video' not in content_type and not url.lower().endswith(('.mp4', '.mov', '.avi', '.mkv')):
            return None, "URL does not appear to be a video file."
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            return tmp_file.name, None
            
    except requests.exceptions.Timeout:
        return None, "Request timed out. Please try a different URL."
    except requests.exceptions.RequestException as e:
        return None, f"Failed to download video: {str(e)}"

def download_with_ytdlp(url: str) -> tuple:
    try:
        tmp_dir = tempfile.mkdtemp()
        output_template = os.path.join(tmp_dir, 'video.%(ext)s')
        
        ydl_opts = {
            'outtmpl': output_template,
            'format': 'bestvideo[vcodec^=avc1]+bestaudio/bestvideo[vcodec^=h264]+bestaudio/best[vcodec^=avc1]/best[vcodec^=h264]/bestvideo[height<=720]+bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4',
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
            'postprocessor_args': ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'],
            'socket_timeout': 60,
            'retries': 3,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)
            
            for f in os.listdir(tmp_dir):
                file_path = os.path.join(tmp_dir, f)
                if os.path.isfile(file_path) and os.path.getsize(file_path) > 1000:
                    final_path = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4').name
                    os.rename(file_path, final_path)
                    return final_path, None
            
            return None, "Failed to download video file."
                
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if "Private video" in error_msg or "login" in error_msg.lower():
            return None, "This video is private or requires login. Please use a public video."
        elif "not available" in error_msg.lower():
            return None, "This video is not available. It may have been removed or is geo-restricted."
        return None, f"Could not download video: {error_msg}"
    except Exception as e:
        return None, f"Error downloading video: {str(e)}"

def analyze_with_openai(frames: list, video_info: dict, api_key: str, ad_data: dict = None, transcript_data: dict = None) -> dict:
    client = OpenAI(api_key=api_key)
    base64_frames = [frame_to_base64(frame, max_size=640) for frame in frames]  # OPTIMIZED: Resize to 640px
    
    prompt = get_analysis_prompt(ad_data, video_info, transcript_data)
    content = [{"type": "text", "text": prompt}]
    for b64_frame in base64_frames:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64_frame}"}
        })
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # OPTIMIZED: Changed from "gpt-4o" to "gpt-4o-mini"
        messages=[{"role": "user", "content": content}],
        response_format={"type": "json_object"},
        max_tokens=3000,  # OPTIMIZED: Reduced from 4096 to 3000
        temperature=0.7
    )
    
    response_content = response.choices[0].message.content
    if not response_content:
        raise ValueError("No response received from OpenAI")
    
    result = json.loads(response_content)
    result["technical_metrics"] = {
        "video_duration_seconds": round(video_info["duration"], 2),
        "frame_rate": round(video_info["fps"], 2),
        "resolution": f"{video_info['width']}x{video_info['height']}",
        "total_frames": video_info["total_frames"]
    }
    if transcript_data:
        result["audio_transcript"] = transcript_data
    
    return result

def analyze_with_claude(frames: list, video_info: dict, api_key: str, ad_data: dict = None, transcript_data: dict = None) -> dict:
    client = anthropic.Anthropic(api_key=api_key)
    base64_frames = [frame_to_base64(frame, max_size=640) for frame in frames]  # OPTIMIZED: Resize to 640px
    
    prompt = get_analysis_prompt(ad_data, video_info, transcript_data)
    content = []
    for b64_frame in base64_frames:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": b64_frame
            }
        })
    content.append({"type": "text", "text": prompt})
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,  # OPTIMIZED: Reduced from 4096
        messages=[{"role": "user", "content": content}]
    )
    
    response_text = response.content[0].text
    json_start = response_text.find('{')
    json_end = response_text.rfind('}') + 1
    if json_start == -1 or json_end == 0:
        raise ValueError("No JSON found in Claude response")
    
    result = json.loads(response_text[json_start:json_end])
    result["technical_metrics"] = {
        "video_duration_seconds": round(video_info["duration"], 2),
        "frame_rate": round(video_info["fps"], 2),
        "resolution": f"{video_info['width']}x{video_info['height']}",
        "total_frames": video_info["total_frames"]
    }
    if transcript_data:
        result["audio_transcript"] = transcript_data
    
    return result

def analyze_with_gemini(frames: list, video_info: dict, api_key: str, ad_data: dict = None, transcript_data: dict = None) -> dict:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = get_analysis_prompt(ad_data, video_info, transcript_data)
    
    # OPTIMIZED: Resize frames for Gemini
    pil_images = []
    for frame in frames:
        img = Image.fromarray(frame)
        if max(img.size) > 640:
            img.thumbnail((640, 640), Image.Resampling.LANCZOS)
        pil_images.append(img)
    
    content = pil_images + [prompt + "\n\nRespond with valid JSON only."]
    
    response = model.generate_content(content)
    response_text = response.text
    
    json_start = response_text.find('{')
    json_end = response_text.rfind('}') + 1
    if json_start == -1 or json_end == 0:
        raise ValueError("No JSON found in Gemini response")
    
    result = json.loads(response_text[json_start:json_end])
    result["technical_metrics"] = {
        "video_duration_seconds": round(video_info["duration"], 2),
        "frame_rate": round(video_info["fps"], 2),
        "resolution": f"{video_info['width']}x{video_info['height']}",
        "total_frames": video_info["total_frames"]
    }
    if transcript_data:
        result["audio_transcript"] = transcript_data
    
    return result

def analyze_video(video_path: str, model: str, api_keys: dict, num_frames: int = 3, ad_data: dict = None, include_audio: bool = True) -> dict:  # Changed default from 5 to 3
    frames, video_info = get_video_frames(video_path, num_frames)
    
    if not frames:
        raise ValueError("Could not extract frames from video")
    
    transcript_data = None
    if include_audio and api_keys.get("openai"):
        audio_path = extract_audio(video_path)
        if audio_path:
            transcript_data = transcribe_audio(audio_path, api_keys["openai"])
    
    if model == "openai":
        if not api_keys.get("openai"):
            raise ValueError("OpenAI API key not provided")
        return analyze_with_openai(frames, video_info, api_keys["openai"], ad_data, transcript_data)
    elif model == "claude":
        if not api_keys.get("anthropic"):
            raise ValueError("Anthropic API key not provided")
        return analyze_with_claude(frames, video_info, api_keys["anthropic"], ad_data, transcript_data)
    elif model == "gemini":
        if not api_keys.get("google"):
            raise ValueError("Google API key not provided")
        return analyze_with_gemini(frames, video_info, api_keys["google"], ad_data, transcript_data)
    else:
        raise ValueError(f"Unknown model: {model}")

def analyze_video_batch(videos: list, model: str, api_keys: dict, num_frames: int = 3, max_workers: int = 6) -> list:  # OPTIMIZED: Changed defaults
    """Process multiple videos in parallel for faster batch analysis"""
    results = []
    
    def process_single(video_data):
        video_path = video_data.get("video_path")
        ad_data = video_data.get("ad_data")
        video_id = video_data.get("video_id")
        ad_name = video_data.get("ad_name")
        
        try:
            analysis = analyze_video(video_path, model, api_keys, num_frames, ad_data, include_audio=True)
            return {
                "video_id": video_id,
                "ad_name": ad_name,
                "analysis": analysis,
                "success": True
            }
        except Exception as e:
            return {
                "video_id": video_id,
                "ad_name": ad_name,
                "error": str(e),
                "success": False
            }
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(process_single, videos))
    
    return results

# def get_best_videos(analyses: list, model: str, api_keys: dict) -> dict:
#     analyses_summary = json.dumps(analyses, indent=2)
#     prompt = BEST_VIDEOS_PROMPT + analyses_summary
    
#     if model == "openai":
#         if not api_keys.get("openai"):
#             raise ValueError("OpenAI API key not provided")
#         client = OpenAI(api_key=api_keys["openai"])
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",  # OPTIMIZED: Changed from "gpt-4o"
#             messages=[{"role": "user", "content": prompt}],
#             response_format={"type": "json_object"},
#             max_tokens=2048
#         )
#         return json.loads(response.choices[0].message.content)
#     elif model == "claude":
#         if not api_keys.get("anthropic"):
#             raise ValueError("Anthropic API key not provided")
#         client = anthropic.Anthropic(api_key=api_keys["anthropic"])
#         response = client.messages.create(
#             model="claude-sonnet-4-20250514",
#             max_tokens=2048,
#             messages=[{"role": "user", "content": prompt + "\n\nRespond with valid JSON only."}]
#         )
#         response_text = response.content[0].text
#         json_start = response_text.find('{')
#         json_end = response_text.rfind('}') + 1
#         return json.loads(response_text[json_start:json_end])
#     elif model == "gemini":
#         if not api_keys.get("google"):
#             raise ValueError("Google API key not provided")
#         genai.configure(api_key=api_keys["google"])
#         gmodel = genai.GenerativeModel('gemini-2.0-flash')
#         response = gmodel.generate_content(prompt + "\n\nRespond with valid JSON only.")
#         response_text = response.text
#         json_start = response_text.find('{')
#         json_end = response_text.rfind('}') + 1
#         return json.loads(response_text[json_start:json_end])
#     else:
#         raise ValueError(f"Unknown model: {model}")



def get_best_videos(analyses: list, model: str, api_keys: dict) -> dict:
    """Find ALL videos with score > 70% instead of top N"""
    
    print(f"📊 Analyzing {len(analyses)} videos...")
    
    # Step 1: Calculate scores for all videos and filter > 70
    scored_videos = []
    
    for analysis in analyses:
        try:
            assessment = analysis.get('analysis', {}).get('overall_assessment', {})
            
            creative = assessment.get('creative_quality_score', 0)
            engagement = assessment.get('engagement_potential', 0)
            conversion = assessment.get('conversion_potential', 0)
            
            # Calculate average score
            if creative or engagement or conversion:
                overall_score = round((creative + engagement + conversion) / 3)
            else:
                overall_score = 0
            
            # Only include if score > 70
            if overall_score > 70:
                scored_videos.append({
                    'video_id': analysis.get('video_id', ''),
                    'ad_name': analysis.get('ad_name', ''),
                    'overall_score': overall_score,
                    'metrics_summary': {
                        'creative_quality': creative,
                        'engagement_potential': engagement,
                        'conversion_potential': conversion,
                        'hook_strength': analysis.get('analysis', {}).get('content_messaging', {}).get('hook_strength', 'N/A'),
                        'scroll_stopping_power': analysis.get('analysis', {}).get('engagement_elements', {}).get('scroll_stopping_power', 0)
                    }
                })
        except Exception as e:
            print(f"⚠️  Error processing video {analysis.get('video_id', 'unknown')}: {e}")
            continue
    
    # Sort by score (highest first)
    scored_videos.sort(key=lambda x: x['overall_score'], reverse=True)
    
    print(f"✅ Found {len(scored_videos)} videos with score > 70%")
    
    # Step 2: If no videos above 70%, return empty
    if not scored_videos:
        return {
            'top_videos': [],
            'insights': {
                'common_success_factors': [],
                'recommendations': ['Improve video quality to achieve scores above 70%'],
                'average_score': 0,
                'total_high_performers': 0,
                'threshold': 70
            }
        }
    
    # Step 3: Prepare data for AI analysis
    analyses_summary = json.dumps([{
        'rank': i+1,
        'video_id': v['video_id'],
        'ad_name': v['ad_name'],
        'overall_score': v['overall_score'],
        'metrics': v['metrics_summary']
    } for i, v in enumerate(scored_videos)], indent=2)
    
    prompt = BEST_VIDEOS_PROMPT + "\n\n" + analyses_summary
    
    print(f"🤖 Using {model} to analyze {len(scored_videos)} high performers...")
    
    try:
        # Step 4: Call AI based on model (YOUR ORIGINAL CODE)
        if model == "openai":
            if not api_keys.get("openai"):
                raise ValueError("OpenAI API key not provided")
            client = OpenAI(api_key=api_keys["openai"])
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=3000
            )
            ai_analysis = json.loads(response.choices[0].message.content)
            
        elif model == "claude":
            if not api_keys.get("anthropic"):
                raise ValueError("Anthropic API key not provided")
            client = anthropic.Anthropic(api_key=api_keys["anthropic"])
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt + "\n\nRespond with valid JSON only."}]
            )
            response_text = response.content[0].text
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            ai_analysis = json.loads(response_text[json_start:json_end])
            
        elif model == "gemini":
            if not api_keys.get("google"):
                raise ValueError("Google API key not provided")
            genai.configure(api_key=api_keys["google"])
            gmodel = genai.GenerativeModel('gemini-2.0-flash')
            response = gmodel.generate_content(prompt + "\n\nRespond with valid JSON only.")
            response_text = response.text
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            ai_analysis = json.loads(response_text[json_start:json_end])
        else:
            raise ValueError(f"Unknown model: {model}")
        
        # Step 5: Merge AI insights with our calculated scores
        for i, video in enumerate(scored_videos):
            if i < len(ai_analysis.get('top_videos', [])):
                ai_video = ai_analysis['top_videos'][i]
                video.update({
                    'key_strengths': ai_video.get('key_strengths', ['High score', 'Strong metrics']),
                    'why_its_best': ai_video.get('why_its_best', f'Strong performance with {video["overall_score"]}% score'),
                    'rank': i + 1
                })
            else:
                video.update({
                    'key_strengths': ['High overall score', 'Strong metrics'],
                    'why_its_best': f'Strong performance with {video["overall_score"]}% score',
                    'rank': i + 1
                })
        
        avg_score = sum(v['overall_score'] for v in scored_videos) / len(scored_videos)
        
        return {
            'top_videos': scored_videos,
            'insights': {
                'common_success_factors': ai_analysis.get('insights', {}).get('common_success_factors', ['High quality']),
                'recommendations': ai_analysis.get('insights', {}).get('recommendations', ['Continue approach']),
                'average_score': round(avg_score, 1),
                'total_high_performers': len(scored_videos),
                'threshold': 70
            }
        }
        
    except Exception as e:
        print(f"⚠️  AI analysis failed: {e}")
        
        # Fallback: Return without AI insights
        for i, video in enumerate(scored_videos):
            video.update({
                'key_strengths': ['High overall score', 'Strong metrics'],
                'why_its_best': f'Performance score: {video["overall_score"]}%',
                'rank': i + 1
            })
        
        avg_score = sum(v['overall_score'] for v in scored_videos) / len(scored_videos)
        
        return {
            'top_videos': scored_videos,
            'insights': {
                'common_success_factors': ['High quality scores'],
                'recommendations': ['Continue similar approach'],
                'average_score': round(avg_score, 1),
                'total_high_performers': len(scored_videos),
                'threshold': 70
            }
        }