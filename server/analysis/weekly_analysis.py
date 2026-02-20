#!/usr/bin/env python3
"""
Automated Weekly Video Ad Analysis
Matches the "Run Complete Analysis" button workflow
"""

import sys
import os

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

import requests
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import json
import time
import traceback
from typing import Optional, Dict, List

# Import video analyzer from your existing code
from server.analysis.video_analyzer import download_video_from_url, analyze_video, get_best_videos

# Configuration
N8N_WEBHOOK_URL = 'https://n8n.scalexagent.cloud/webhook/facebook-ads-analyzer'

# Initialize Firebase
def initialize_firebase():
    try:
        firebase_admin.get_app()
        print("✅ Firebase already initialized")
        return firestore.client()
    except ValueError:
        try:
            key_path = os.path.join(project_root, 'serviceAccountKey.json')
            print(f"🔍 Looking for key at: {key_path}")
            
            if not os.path.exists(key_path):
                raise FileNotFoundError(f"serviceAccountKey.json not found at {key_path}")
            
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
            return firestore.client()
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            sys.exit(1)

db = initialize_firebase()

def get_api_keys() -> Dict[str, str]:
    """Get API keys from Firebase config"""
    print("�� Loading API keys from Firebase...")
    
    api_keys = {
        "openai": "",
        "anthropic": "",
        "google": "",
    }
    
    try:
        # Get OpenAI key
        openai_doc = db.collection('config').document('openai').get()
        if openai_doc.exists:
            api_keys["openai"] = openai_doc.to_dict().get('apiKey', '')
            if api_keys["openai"]:
                print("  ✅ OpenAI key loaded")
        
        # Get Claude key
        claude_doc = db.collection('config').document('claude').get()
        if claude_doc.exists:
            api_keys["anthropic"] = claude_doc.to_dict().get('apiKey', '')
            if api_keys["anthropic"]:
                print("  ✅ Claude key loaded")
        
        # Get Gemini key
        gemini_doc = db.collection('config').document('gemini').get()
        if gemini_doc.exists:
            api_keys["google"] = gemini_doc.to_dict().get('apiKey', '')
            if api_keys["google"]:
                print("  ✅ Gemini key loaded")
        
        # Check which model is default
        model = "openai"  # default
        if openai_doc.exists and openai_doc.to_dict().get('default') == True:
            model = "openai"
        elif claude_doc.exists and claude_doc.to_dict().get('default') == True:
            model = "claude"
        elif gemini_doc.exists and gemini_doc.to_dict().get('default') == True:
            model = "gemini"
        
        print(f"  ℹ️  Using model: {model}")
        return api_keys, model
        
    except Exception as e:
        print(f"  ⚠️ Error loading API keys: {e}")
        return api_keys, "openai"

def log_step(job_id: str, step: str, status: str, data: Optional[Dict] = None):
    """Update job status in Firestore"""
    try:
        job_ref = db.collection('automationJobs').document(job_id)
        update_data = {
            f'steps.{step}': status,
            f'steps.{step}UpdatedAt': firestore.SERVER_TIMESTAMP
        }
        if data:
            update_data[f'steps.{step}Data'] = data
        job_ref.update(update_data)
        print(f"📝 Step '{step}' updated: {status}")
    except Exception as e:
        print(f"⚠️ Could not update job log: {e}")

def fetch_ads_from_n8n(job_id: str) -> Dict:
    """Step 1: Fetch ads from n8n for all accounts"""
    print("\n📥 STEP 1: Fetching ads from n8n...")
    
    # Get Meta token
    meta_config = db.collection('config').document('meta').get()
    if not meta_config.exists:
        raise Exception("Meta token not found in Firestore")
    
    meta_token = meta_config.to_dict().get('accessToken')
    if not meta_token:
        raise Exception("Meta access token is empty")
    
    print("✅ Meta token retrieved")
    
    # Get ad accounts
    accounts_ref = db.collection('adAccounts').stream()
    ad_accounts = [{'id': doc.id, **doc.to_dict()} for doc in accounts_ref]
    
    if not ad_accounts:
        raise Exception("No ad accounts found")
    
    print(f"✅ Found {len(ad_accounts)} ad accounts")
    
    total_ads = 0
    successful_accounts = 0
    failed_accounts = []
    
    # Use last 7 days date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    date_from = start_date.strftime('%Y-%m-%d')
    date_to = end_date.strftime('%Y-%m-%d')
    
    print(f"📅 Date range: {date_from} to {date_to}")
    
    for account in ad_accounts:
        try:
            print(f"\n📊 Processing: {account.get('name', 'Unknown')}")
            
            account_id = account.get('id', '')
            if not account_id.startswith('act_'):
                account_id = f"act_{account_id}"
            
            payload = {
                "config": {
                    "adAccountId": account_id,
                    "facebookToken": meta_token,
                    "targetCpa": 0,
                    "dateFrom": date_from,
                    "dateTo": date_to,
                    "funnelType": "Leads"
                },
                "accountName": account.get('name', 'Unknown')
            }
            
            print(f"  📤 Sending request to n8n...")
            response = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=120)
            
            print(f"  📥 Response status: {response.status_code}")
            
            if response.status_code != 200:
                error_msg = f"HTTP {response.status_code}"
                print(f"  ❌ {error_msg}")
                failed_accounts.append({'name': account.get('name'), 'error': error_msg})
                continue
            
            # Check if response is empty
            response_text = response.text.strip()
            if not response_text:
                print(f"  ⚠️  Empty response from n8n")
                continue
            
            # Try to parse JSON
            try:
                ads_data = response.json()
            except json.JSONDecodeError as e:
                print(f"  ❌ Invalid JSON response")
                failed_accounts.append({'name': account.get('name'), 'error': "Invalid JSON"})
                continue
            
            if not isinstance(ads_data, list):
                ads_data = [ads_data]
            
            # Filter out empty objects
            ads_data = [ad for ad in ads_data if ad and isinstance(ad, dict) and ad.get('Ad ID')]
            
            if not ads_data:
                print(f"  ⚠️  No valid ads returned")
                continue
            
            print(f"  📥 Received {len(ads_data)} ads")
            
            # Save to Firestore in weeklyAdsData
            batch = db.batch()
            batch_count = 0
            
            for ad in ads_data:
                ad_id = str(ad.get('Ad ID') or ad.get('adId') or ad.get('ad_id') or f"ad_{int(time.time())}")
                
                ad_ref = db.collection('weeklyAdsData').document('data').collection('ads').document(ad_id)
                
                batch.set(ad_ref, {
                    **ad,
                    'accountId': account.get('id'),
                    'accountName': account.get('name'),
                    'fetchedAt': firestore.SERVER_TIMESTAMP,
                    'weekStartDate': date_from,
                    'weekEndDate': date_to
                })
                
                batch_count += 1
                
                if batch_count >= 500:
                    batch.commit()
                    batch = db.batch()
                    batch_count = 0
            
            if batch_count > 0:
                batch.commit()
            
            total_ads += len(ads_data)
            successful_accounts += 1
            print(f"  ✅ Saved {len(ads_data)} ads")
            
        except Exception as e:
            error_msg = str(e)
            print(f"  ❌ Error: {error_msg}")
            failed_accounts.append({'name': account.get('name'), 'error': error_msg})
            continue
    
    print(f"\n📊 FETCH SUMMARY:")
    print(f"  Total ads: {total_ads}")
    print(f"  Successful accounts: {successful_accounts}/{len(ad_accounts)}")
    if failed_accounts:
        print(f"  Failed accounts: {len(failed_accounts)}")
    
    result = {
        'totalAds': total_ads,
        'accountsProcessed': successful_accounts,
        'accountsTotal': len(ad_accounts),
        'failedAccounts': failed_accounts
    }
    
    return result

def analyze_videos_from_firebase(job_id: str, api_keys: Dict, model: str, num_frames: int = 5) -> Dict:
    """Step 2: Analyze videos from Firebase (matches frontend analyzeVideos call)"""
    print(f"\n�� STEP 2: Analyzing videos...")
    
    # Get ads from weeklyAdsData
    print("  📥 Loading ads from weeklyAdsData...")
    ads_ref = db.collection('weeklyAdsData').document('data').collection('ads').stream()
    
    valid_videos = []
    skipped = []
    
    for ad_doc in ads_ref:
        ad = ad_doc.to_dict()
        video_id = ad.get('Video ID') or ad.get('videoId') or ad.get('video_id')
        ad_name = ad.get('Ad Name') or ad.get('adName') or 'Unknown'
        
        if not video_id or not str(video_id).strip():
            skipped.append({'name': ad_name, 'reason': 'Missing Video ID'})
            continue
        
        video_id_str = str(video_id)
        if not video_id_str.isdigit() or len(video_id_str) < 10 or len(video_id_str) > 20:
            skipped.append({'name': ad_name, 'reason': 'Invalid Video ID'})
            continue
        
        valid_videos.append({
            'video_id': video_id,
            'video_url': f"https://www.facebook.com/reel/{video_id}",
            'ad_name': ad_name,
            'ad_data': ad
        })
    
    print(f"✅ Valid videos: {len(valid_videos)}")
    print(f"⚠️  Skipped: {len(skipped)}")
    
    if not valid_videos:
        print("❌ No valid videos to analyze")
        return {
            'validVideosCount': 0,
            'analyzedCount': 0,
            'skippedCount': len(skipped)
        }
    
    print(f"\n🎬 Analyzing {len(valid_videos)} videos...")
    print(f"   Model: {model}")
    print(f"   Frames: {num_frames}")
    print(f"   Estimated time: {len(valid_videos) * 1.5:.0f} minutes\n")
    
    successful_results = []
    failed_results = []
    
    for i, video in enumerate(valid_videos, 1):
        try:
            print(f"📹 [{i}/{len(valid_videos)}] {video['ad_name'][:60]}")
            
            # Download video
            print(f"   ⬇️  Downloading...")
            video_path, download_error = download_video_from_url(video['video_url'])
            
            if download_error:
                print(f"   ❌ Download failed: {download_error[:100]}")
                failed_results.append({'video_id': video['video_id'], 'ad_name': video['ad_name'], 'error': download_error})
                continue
            
            # Analyze video
            print(f"   🔍 Analyzing...")
            analysis = analyze_video(
                video_path=video_path,
                model=model,
                api_keys=api_keys,
                num_frames=num_frames,
                ad_data=video['ad_data'],
                include_audio=True
            )
            
            # Clean up
            if video_path and os.path.exists(video_path):
                try:
                    os.unlink(video_path)
                except:
                    pass
            
            result = {
                'video_id': video['video_id'],
                'ad_name': video['ad_name'],
                'video_url': video['video_url'],
                'ad_data': video['ad_data'],
                'analysis': analysis,
                'success': True,
                'model': model
            }
            
            successful_results.append(result)
            print(f"   ✅ Done\n")
            
            # Delay to avoid rate limits
            if i < len(valid_videos):
                time.sleep(3)
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:150]}\n")
            failed_results.append({'video_id': video['video_id'], 'ad_name': video['ad_name'], 'error': str(e)})
    
    print(f"\n📊 ANALYSIS SUMMARY:")
    print(f"  ✅ Successful: {len(successful_results)}")
    print(f"  ❌ Failed: {len(failed_results)}")
    
    # Save results to Firebase (clear old results first - matches frontend)
    if successful_results:
        print(f"\n💾 Saving {len(successful_results)} results...")
        
        # Delete old results
        print("  🗑️  Deleting old results...")
        old_results = db.collection('videoAnalysis').document('data').collection('results').stream()
        batch = db.batch()
        count = 0
        for old_result in old_results:
            batch.delete(old_result.reference)
            count += 1
            if count >= 500:
                batch.commit()
                batch = db.batch()
                count = 0
        if count > 0:
            batch.commit()
        
        # Save new results
        print("  💾 Saving new results...")
        batch = db.batch()
        batch_count = 0
        
        for result in successful_results:
            result_ref = db.collection('videoAnalysis').document('data').collection('results').document(result['video_id'])
            batch.set(result_ref, {
                **result,
                'savedAt': firestore.SERVER_TIMESTAMP
            })
            batch_count += 1
            
            if batch_count >= 500:
                batch.commit()
                batch = db.batch()
                batch_count = 0
        
        if batch_count > 0:
            batch.commit()
        
        print(f"  ✅ Saved {len(successful_results)} results")
    
    return {
        'validVideosCount': len(valid_videos),
        'analyzedCount': len(successful_results),
        'failedCount': len(failed_results),
        'skippedCount': len(skipped)
    }

def find_best_videos_step(job_id: str, api_keys: Dict, model: str) -> Dict:
    """Step 3: Find ALL videos with score > 70%"""
    print("\n⭐ STEP 3: Finding videos with score > 70%...")
    
    # Get all analysis results
    results_ref = db.collection('videoAnalysis').document('data').collection('results').stream()
    
    analyses = []
    for result_doc in results_ref:
        data = result_doc.to_dict()
        if data.get('analysis'):
            analyses.append({
                'video_id': result_doc.id,
                'ad_name': data.get('ad_name', ''),
                'analysis': data.get('analysis', {})
            })
    
    print(f"📊 Found {len(analyses)} total analysis results")
    
    if not analyses:
        print("⚠️  No results to analyze")
        return {
            'topVideosCount': 0,
            'highPerformersCount': 0,
            'threshold': 70,
            'averageScore': 0
        }
    
    # Calculate scores and filter > 70%
    print("🔍 Calculating scores and filtering...")
    high_performers = []
    
    for analysis in analyses:
        try:
            assessment = analysis.get('analysis', {}).get('overall_assessment', {})
            
            creative = assessment.get('creative_quality_score', 0)
            engagement = assessment.get('engagement_potential', 0)
            conversion = assessment.get('conversion_potential', 0)
            
            if creative or engagement or conversion:
                overall_score = round((creative + engagement + conversion) / 3)
            else:
                overall_score = 0
            
            # Only include if score > 70
            if overall_score > 70:
                high_performers.append({
                    'video_id': analysis['video_id'],
                    'ad_name': analysis['ad_name'],
                    'overall_score': overall_score,
                    'analysis': analysis['analysis']
                })
        except Exception as e:
            print(f"  ⚠️ Error processing {analysis.get('video_id', 'unknown')}: {e}")
            continue
    
    # Sort by score
    high_performers.sort(key=lambda x: x['overall_score'], reverse=True)
    
    print(f"✅ Found {len(high_performers)} videos with score > 70%")
    
    if not high_performers:
        print("⚠️  No videos with score > 70%")
        return {
            'topVideosCount': 0,
            'highPerformersCount': 0,
            'threshold': 70,
            'averageScore': 0
        }
    
    # Show top scores
    if len(high_performers) >= 3:
        print(f"   Top 3 scores: {high_performers[0]['overall_score']}, {high_performers[1]['overall_score']}, {high_performers[2]['overall_score']}")
    
    # Use AI to analyze these high performers
    print(f"🤖 Using {model} to analyze {len(high_performers)} high performers...")
    
    # Prepare analyses in format expected by get_best_videos
    analyses_for_ai = [
        {
            'video_id': v['video_id'], 
            'ad_name': v['ad_name'], 
            'analysis': v['analysis']
        } 
        for v in high_performers
    ]
    
    best_videos_result = get_best_videos(analyses_for_ai, model, api_keys)
    
    top_count = len(best_videos_result.get('top_videos', []))
    avg_score = sum(v['overall_score'] for v in high_performers) / len(high_performers)
    top_score = high_performers[0]['overall_score'] if high_performers else 0
    
    print(f"✅ Analysis complete:")
    print(f"   High performers (>70%): {len(high_performers)}")
    print(f"   Average score: {avg_score:.1f}%")
    print(f"   Top score: {top_score}%")
    
    # Save to Firebase
    print("💾 Saving best videos analysis...")
    doc_id = f"analysis_{int(time.time())}"
    best_ref = db.collection('bestVideosAnalysis').document(doc_id)
    best_ref.set({
        **best_videos_result,
        'savedAt': firestore.SERVER_TIMESTAMP,
        'savedBy': 'automated_cron',
        'analysisDate': datetime.now().isoformat(),
        'threshold': 70,
        'totalAnalyzed': len(analyses),
        'highPerformersCount': len(high_performers),
        'averageScore': round(avg_score, 1),
        'topScore': top_score
    })
    
    print(f"✅ Best videos saved: {doc_id}")
    
    return {
        'topVideosCount': top_count,
        'highPerformersCount': len(high_performers),
        'threshold': 70,
        'averageScore': round(avg_score, 1),
        'topScore': top_score,
        'documentId': doc_id
    }


def run_weekly_analysis():
    """Main function - matches the frontend runCompleteAnalysis workflow"""
    print("=" * 60)
    print("🚀 WEEKLY VIDEO AD ANALYSIS STARTED")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Get API keys
    api_keys, model = get_api_keys()
    
    # Create job tracking
    job_ref = db.collection('automationJobs').document()
    job_id = job_ref.id
    
    job_ref.set({
        'type': 'weekly_analysis_cron',
        'status': 'running',
        'startedAt': firestore.SERVER_TIMESTAMP,
        'steps': {
            'fetchAds': 'pending',
            'analyzeVideos': 'pending',
            'findBest': 'pending'
        }
    })
    
    try:
        # Step 1: Fetch ads from n8n
        log_step(job_id, 'fetchAds', 'running')
        fetch_results = fetch_ads_from_n8n(job_id)
        log_step(job_id, 'fetchAds', 'completed', fetch_results)
        
        # Step 2: Analyze videos
        log_step(job_id, 'analyzeVideos', 'running')
        analysis_results = analyze_videos_from_firebase(job_id, api_keys, model, num_frames=5)
        log_step(job_id, 'analyzeVideos', 'completed', analysis_results)
        
        # Step 3: Find best videos (only if we have results)
        if analysis_results['analyzedCount'] > 0:
            log_step(job_id, 'findBest', 'running')
            best_results = find_best_videos_step(job_id, api_keys, model)
            log_step(job_id, 'findBest', 'completed', best_results)
        else:
            print("\n⚠️  Skipping best videos - no successful analyses")
            best_results = {
                'topVideosCount': 0,
                'highPerformersCount': 0,
                'threshold': 70,
                'averageScore': 0
            }
        
        # Mark as completed
    job_ref.update({
            'status': 'completed',
            'completedAt': firestore.SERVER_TIMESTAMP,
            'summary': {
                'adsProcessed': fetch_results['totalAds'],
                'videosAnalyzed': analysis_results['analyzedCount'],
                'highPerformers': best_results.get('highPerformersCount', 0),
                'averageScore': best_results.get('averageScore', 0),
                'topScore': best_results.get('topScore', 0),
                'threshold': 70
            }
        })
        
    print("\n" + "=" * 60)
    print("✅ WEEKLY ANALYSIS COMPLETED")
    print(f"   Ads fetched: {fetch_results['totalAds']}")
    print(f"   Videos analyzed: {analysis_results['analyzedCount']}")
    print(f"   High performers (>70%): {best_results.get('highPerformersCount', 0)}")
    if best_results.get('highPerformersCount', 0) > 0:
            print(f"   Average score: {best_results.get('averageScore', 0):.1f}%")
            print(f"   Top score: {best_results.get('topScore', 0)}%")
            print("=" * 60)
        
    return True
        
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"\n❌ ANALYSIS FAILED: {error_msg}")
        print(f"\n{error_trace}")
        
        job_ref.update({
            'status': 'failed',
            'error': {'message': error_msg, 'trace': error_trace},
            'failedAt': firestore.SERVER_TIMESTAMP
        })
        
        return False

if __name__ == '__main__':
    try:
        success = run_weekly_analysis()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        traceback.print_exc()
        sys.exit(1)
