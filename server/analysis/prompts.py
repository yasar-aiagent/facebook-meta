ANALYSIS_PROMPT_INTRO = """Analyze these video ad frames comprehensively across 200+ metrics for Meta video ads.
For each metric, provide a score (0-100) where applicable, or a descriptive value.

IMPORTANT: Return your response as a valid JSON object with ALL these categories and metrics:

{
    "actor_human_elements": {
        "has_human_actor": 0-100,
        "male_actor_present": 0-100,
        "female_actor_present": 0-100,
        "animated_character": 0-100,
        "celebrity_influencer": 0-100,
        "actor_age_group": "string (child/teen/young_adult/adult/senior/mixed)",
        "actor_body_type": "string (slim/average/athletic/plus_size/varied)",
        "actor_diversity": "string (low/medium/high)",
        "number_of_actors": number,
        "actor_style": "string",
        "actor_speaking": 0-100,
        "actor_demonstrating_product": 0-100,
        "facial_expression": "string",
        "direct_eye_contact": 0-100,
        "hand_gestures_used": 0-100,
        "actor_movement": "string (static/minimal/moderate/dynamic)",
        "clothing_style": "string",
        "authenticity_level": "string (low/medium/high)",
        "energy_level": "string (low/medium/high)",
        "relatability_score": 0-100,
        "actor_screen_time_percent": 0-100,
        "actor_positioning": "string (center/left/right/varied)",
        "actor_close_up_shots": 0-100,
        "actor_full_body_shots": 0-100,
        "actor_group_shots": 0-100,
        "actor_interaction_with_product": 0-100,
        "actor_emotion_range": "string (single/varied/dynamic)",
        "actor_wardrobe_changes": number,
        "actor_props_used": 0-100,
        "actor_setting_changes": number
    },
    "color_visual_style": {
        "color_contrast_level": "string (low/medium/high)",
        "dark_color_scheme": 0-100,
        "light_color_scheme": 0-100,
        "vibrant_colors": 0-100,
        "pastel_colors": 0-100,
        "monochrome_style": 0-100,
        "warm_colors": 0-100,
        "cool_colors": 0-100,
        "color_consistency": "string (low/medium/high)",
        "background_color_intensity": "string (low/medium/high)",
        "brand_colors_used": 0-100,
        "seasonal_colors": 0-100,
        "cultural_color_significance": 0-100,
        "gradient_usage": 0-100,
        "black_white_filter": 0-100,
        "neon_colors": 0-100,
        "earth_tones": 0-100,
        "metallic_colors": 0-100,
        "color_saturation_level": "string (desaturated/normal/saturated/oversaturated)",
        "color_temperature": "string (cold/neutral/warm/very_warm)",
        "dominant_color": "string",
        "secondary_color": "string",
        "accent_color": "string",
        "color_harmony_type": "string (complementary/analogous/triadic/monochromatic)",
        "color_mood": "string (energetic/calm/professional/playful/luxurious)"
    },
    "video_production": {
        "aspect_ratio": "string (16:9/9:16/1:1/4:5)",
        "video_quality": "string (low/medium/high/professional)",
        "lighting_quality": "string (poor/average/good/excellent)",
        "lighting_type": "string (natural/studio/mixed/dramatic/soft)",
        "lighting_direction": "string (front/side/back/top/mixed)",
        "background_type": "string",
        "background_blur": 0-100,
        "background_complexity": "string (simple/moderate/complex)",
        "focus_quality": "string (poor/average/good/excellent)",
        "depth_of_field": "string (shallow/medium/deep)",
        "camera_movement": "string (static/pan/zoom/tracking/handheld)",
        "camera_angle": "string (eye_level/low/high/dutch/varied)",
        "shot_composition": "string (rule_of_thirds/centered/symmetrical/dynamic)",
        "transition_style": "string",
        "transition_frequency": "string (none/few/moderate/frequent)",
        "speed_changes": 0-100,
        "slow_motion_used": 0-100,
        "fast_motion_used": 0-100,
        "timelapse_used": 0-100,
        "color_filter_applied": 0-100,
        "color_grading_style": "string (natural/cinematic/vintage/modern/dramatic)",
        "special_effects": 0-100,
        "vfx_type": "string (none/subtle/moderate/heavy)",
        "screen_recording": 0-100,
        "ugc_style": 0-100,
        "b_roll_footage": 0-100,
        "stock_footage_type": "string (none/minimal/moderate/heavy)",
        "split_screen": 0-100,
        "before_after_comparison": 0-100,
        "picture_in_picture": 0-100,
        "green_screen_used": 0-100,
        "motion_graphics": 0-100,
        "3d_elements": 0-100,
        "lens_flare": 0-100,
        "film_grain": 0-100,
        "vignette_effect": 0-100
    },
    "text_typography": {
        "text_overlay_amount": "string (none/minimal/moderate/heavy)",
        "subtitles_captions": 0-100,
        "auto_captions_style": 0-100,
        "text_size": "string (small/medium/large/extra_large)",
        "font_style": "string",
        "font_weight": "string (light/regular/bold/extra_bold)",
        "text_animation": 0-100,
        "text_animation_type": "string (none/fade/slide/pop/kinetic)",
        "headline_present": 0-100,
        "subheadline_present": 0-100,
        "caption_length": "string (short/medium/long)",
        "emojis_used": 0-100,
        "numbers_stats_shown": 0-100,
        "percentage_shown": 0-100,
        "bullet_points": 0-100,
        "question_asked": 0-100,
        "urgency_language": 0-100,
        "scarcity_language": 0-100,
        "benefits_highlighted": 0-100,
        "features_listed": 0-100,
        "problem_stated": 0-100,
        "solution_presented": 0-100,
        "social_proof": 0-100,
        "testimonial_quote": 0-100,
        "price_discount_shown": 0-100,
        "original_price_shown": 0-100,
        "savings_highlighted": 0-100,
        "free_shipping_mentioned": 0-100,
        "guarantee_mentioned": 0-100,
        "text_contrast_ratio": "string (low/medium/high)",
        "text_background_overlay": 0-100,
        "text_shadow_used": 0-100,
        "text_outline_used": 0-100,
        "text_position": "string (top/center/bottom/varied)",
        "text_alignment": "string (left/center/right/justified)"
    },
    "branding_logo": {
        "logo_placement": "string (none/corner/center/end_card/throughout)",
        "logo_position": "string (top_left/top_right/bottom_left/bottom_right/center)",
        "logo_style": "string (full_color/monochrome/watermark/animated)",
        "logo_size": "string (none/small/medium/large)",
        "logo_duration": "string (none/brief/moderate/throughout)",
        "logo_animation": 0-100,
        "brand_name_text_shown": 0-100,
        "brand_tagline_shown": 0-100,
        "brand_colors_consistency": 0-100,
        "brand_font_consistency": 0-100,
        "brand_consistency_score": 0-100,
        "brand_watermark": 0-100,
        "brand_sound_likely": 0-100,
        "website_url_shown": 0-100,
        "social_handles_shown": 0-100,
        "qr_code_present": 0-100
    },
    "call_to_action": {
        "cta_present": 0-100,
        "cta_placement": "string (none/beginning/middle/end/throughout)",
        "cta_timing": "string (early/middle/late/multiple)",
        "cta_button_visible": 0-100,
        "cta_button_color": "string",
        "cta_button_animation": 0-100,
        "arrow_pointer_used": 0-100,
        "swipe_up_indicator": 0-100,
        "tap_animation": 0-100,
        "cta_visibility": 0-100,
        "cta_repetition": "string (none/once/twice/multiple)",
        "cta_clarity": "string (unclear/average/clear/very_clear)",
        "cta_text_type": "string (shop_now/learn_more/sign_up/download/get_started/other)",
        "cta_urgency": 0-100,
        "cta_size": "string (small/medium/large)",
        "cta_contrast": "string (low/medium/high)",
        "multiple_ctas": 0-100,
        "verbal_cta_likely": 0-100
    },
    "audio_elements": {
        "background_music_likely": 0-100,
        "music_tempo_estimate": "string (slow/medium/fast/varied)",
        "music_genre_estimate": "string (pop/electronic/hip_hop/acoustic/cinematic/corporate/other)",
        "music_energy_level": "string (low/medium/high/building)",
        "music_mood": "string (upbeat/calm/dramatic/inspirational/playful)",
        "trending_audio_likely": 0-100,
        "voiceover_likely": 0-100,
        "voiceover_gender_estimate": "string (male/female/both/unclear)",
        "voiceover_tone_estimate": "string (professional/casual/excited/calm/authoritative)",
        "voiceover_speed_estimate": "string (slow/normal/fast)",
        "natural_sound_likely": 0-100,
        "sound_effects_likely": 0-100,
        "asmr_elements": 0-100,
        "silence_used": 0-100,
        "audio_ducking_likely": 0-100,
        "music_beat_sync_likely": 0-100
    },
    "script_analysis": {
        "script_present": 0-100,
        "script_quality_score": 0-100,
        "hook_effectiveness": 0-100,
        "hook_timing_seconds": number,
        "opening_hook_type": "string (question/bold_claim/problem/curiosity/statistic/story/shock)",
        "message_clarity": 0-100,
        "value_proposition_clarity": 0-100,
        "key_benefit_mentioned": 0-100,
        "pain_point_addressed": 0-100,
        "solution_presented": 0-100,
        "cta_verbal_clarity": 0-100,
        "cta_verbal_strength": "string (none/weak/average/strong/very_strong)",
        "urgency_in_script": 0-100,
        "scarcity_in_script": 0-100,
        "social_proof_verbal": 0-100,
        "emotional_language": 0-100,
        "power_words_used": 0-100,
        "script_tone": "string (conversational/professional/excited/calm/authoritative/friendly)",
        "script_pacing": "string (slow/medium/fast/varied)",
        "script_length": "string (very_short/short/medium/long)",
        "word_count_estimate": number,
        "sentences_per_minute": number,
        "repetition_used": 0-100,
        "rhetorical_questions": 0-100,
        "storytelling_in_script": 0-100,
        "humor_in_script": 0-100,
        "testimonial_in_script": 0-100,
        "numbers_statistics_verbal": 0-100,
        "brand_mention_count": number,
        "product_mention_count": number,
        "competitor_mention": 0-100,
        "guarantee_promise": 0-100,
        "script_memorability": 0-100,
        "audio_visual_sync": 0-100,
        "script_matches_visuals": 0-100,
        "key_phrases": ["list of key phrases from script"],
        "script_summary": "string (1-2 sentence summary of what the script says)",
        "script_improvement_suggestions": ["list of suggestions to improve the script"]
    },
    "content_messaging": {
        "product_shown": 0-100,
        "product_close_up": 0-100,
        "product_in_use": 0-100,
        "product_packaging_shown": 0-100,
        "product_variety_shown": number,
        "unboxing_content": 0-100,
        "animated_graphics": 0-100,
        "infographics_used": 0-100,
        "testimonial_present": 0-100,
        "customer_review_shown": 0-100,
        "star_rating_shown": 0-100,
        "influencer_endorsement": 0-100,
        "expert_endorsement": 0-100,
        "tutorial_style": 0-100,
        "how_to_content": 0-100,
        "demonstration_content": 0-100,
        "comparison_content": 0-100,
        "storytelling_approach": "string (narrative/problem_solution/testimonial/lifestyle/educational)",
        "emotional_appeal_type": "string (happiness/fear/trust/excitement/nostalgia/aspiration)",
        "humor_used": 0-100,
        "fear_urgency_appeal": 0-100,
        "fomo_appeal": 0-100,
        "educational_content": 0-100,
        "entertainment_value": 0-100,
        "inspirational_content": 0-100,
        "lifestyle_content": 0-100,
        "behind_the_scenes": 0-100,
        "hook_strength": "string (weak/average/strong/very_strong)",
        "hook_type": "string (question/statement/visual/action/statistic)",
        "opening_style": "string (problem/benefit/action/question/story)",
        "closing_style": "string (cta/summary/cliffhanger/loop/fade)",
        "pattern_interrupt": 0-100,
        "curiosity_gap": 0-100,
        "transformation_shown": 0-100,
        "results_shown": 0-100,
        "social_proof_type": "string (none/reviews/testimonials/numbers/awards/media)"
    },
    "engagement_elements": {
        "scroll_stopping_power": 0-100,
        "first_3_seconds_impact": 0-100,
        "visual_variety": 0-100,
        "pacing_score": 0-100,
        "scene_changes_per_5_sec": number,
        "movement_intensity": "string (low/medium/high)",
        "eye_catching_elements": 0-100,
        "pattern_breaks": number,
        "surprise_elements": 0-100,
        "interactive_elements_suggested": 0-100,
        "loop_potential": 0-100,
        "shareability_score": 0-100,
        "comment_bait": 0-100,
        "save_worthiness": 0-100,
        "rewatchability": 0-100
    },
    "platform_optimization": {
        "mobile_optimized": 0-100,
        "vertical_format_score": 0-100,
        "sound_off_friendly": 0-100,
        "caption_dependency": 0-100,
        "thumbnail_appeal": 0-100,
        "feed_stopping_power": 0-100,
        "stories_format_fit": 0-100,
        "reels_format_fit": 0-100,
        "ad_format_guess": "string (feed/stories/reels/in_stream)",
        "platform_native_feel": 0-100
    },
    "overall_assessment": {
        "estimated_target_audience": "string",
        "target_age_range": "string (18-24/25-34/35-44/45-54/55+/broad)",
        "target_gender": "string (male/female/all)",
        "ad_objective_guess": "string (awareness/consideration/conversion)",
        "funnel_stage": "string (top/middle/bottom)",
        "industry_category": "string",
        "creative_quality_score": 0-100,
        "engagement_potential": 0-100,
        "conversion_potential": 0-100,
        "professionalism_score": 0-100,
        "uniqueness_score": 0-100,
        "trend_alignment": 0-100,
        "brand_safety_score": 0-100,
        "compliance_score": 0-100,
        "key_strengths": ["list of strings"],
        "areas_for_improvement": ["list of strings"],
        "similar_ad_style": "string",
        "recommended_optimizations": ["list of strings"],
        "estimated_performance_tier": "string (low/average/good/excellent)"
    }
}

Analyze all frames collectively. Provide accurate scores based on visual evidence. Be thorough and precise.
If ad performance data is provided, use it to provide insights on what visual/creative elements might be contributing to that performance."""

ANALYSIS_PROMPT = ANALYSIS_PROMPT_INTRO

def get_analysis_prompt(ad_data: dict = None, video_info: dict = None, transcript_data: dict = None) -> str:
    parts = []
    
    if ad_data:
        ad_context = "AD PERFORMANCE DATA (use this to correlate visual elements with actual performance):\n"
        performance_fields = [
            ("Impressions", "impressions"),
            ("Clicks", "clicks"),
            ("CTR", "ctr"),
            ("CPC", "cpc"),
            ("CPM", "cpm"),
            ("Spend", "spend"),
            ("Leads", "leads"),
            ("Purchases", "purchases"),
            ("ROAS", "roas"),
            ("Landing Page Views", "landing_page_views"),
            ("Outbound Clicks", "outbound_clicks"),
            ("Cost Per Acquisition", "cost_per_acquisition"),
            ("CTA Type", "cta_type"),
            ("Campaign Name", "campaign_name"),
            ("Video Title", "video_title"),
            ("Video Body", "video_body"),
        ]
        for display_name, key in performance_fields:
            value = ad_data.get(display_name) or ad_data.get(key)
            if value:
                ad_context += f"- {display_name}: {value}\n"
        parts.append(ad_context)
    
    if transcript_data:
        transcript_context = "AUDIO TRANSCRIPT (actual spoken words in the video):\n"
        transcript_context += f"Language: {transcript_data.get('language', 'unknown')}\n"
        transcript_context += f"Full Script: {transcript_data.get('transcript', 'No transcript available')}\n"
        if transcript_data.get('segments'):
            transcript_context += "Timed Segments:\n"
            for seg in transcript_data['segments'][:10]:
                transcript_context += f"  [{seg['start']:.1f}s - {seg['end']:.1f}s]: {seg['text']}\n"
        parts.append(transcript_context)
    
    if video_info:
        tech_info = f"""TECHNICAL VIDEO INFO:
- Duration: {video_info.get('duration', 0):.2f} seconds
- Resolution: {video_info.get('width', 0)}x{video_info.get('height', 0)}
- Frame Rate: {video_info.get('fps', 0):.2f} fps
- Total Frames: {video_info.get('total_frames', 0)}"""
        parts.append(tech_info)
    
    context = "\n\n".join(parts) + "\n\n" if parts else ""
    return context + ANALYSIS_PROMPT_INTRO

BEST_VIDEOS_PROMPT = """Based on the video analysis data provided below, identify and rank the TOP 3 BEST performing videos.

For each video, consider these key factors:
1. Creative Quality Score (from overall_assessment)
2. Engagement Potential (from overall_assessment)
3. Conversion Potential (from overall_assessment)
4. Hook Strength (from content_messaging)
5. Scroll Stopping Power (from engagement_elements)
6. Platform Optimization scores

Return a JSON response with this structure:
{
    "top_videos": [
        {
            "rank": 1,
            "video_id": "string",
            "ad_name": "string",
            "overall_score": 0-100,
            "key_strengths": ["list of top 3 strengths"],
            "why_its_best": "brief explanation why this video ranks here",
            "metrics_summary": {
                "creative_quality": 0-100,
                "engagement_potential": 0-100,
                "conversion_potential": 0-100,
                "hook_strength": "string",
                "scroll_stopping_power": 0-100
            }
        }
    ],
    "insights": {
        "common_success_factors": ["list of patterns seen in top videos"],
        "recommendations": ["list of recommendations for future ads"]
    }
}

VIDEO ANALYSIS DATA:
"""

METRIC_CATEGORIES = {
    "Actor & Human Elements": [
        "Has Human Actor", "Male Actor Present", "Female Actor Present",
        "Animated Character", "Celebrity/Influencer", "Actor Age Group",
        "Actor Body Type", "Actor Diversity", "Number of Actors",
        "Actor Speaking", "Actor Demonstrating Product", "Facial Expression",
        "Direct Eye Contact", "Hand Gestures", "Actor Movement",
        "Clothing Style", "Authenticity Level", "Energy Level",
        "Relatability Score", "Actor Screen Time", "Actor Positioning",
        "Close Up Shots", "Full Body Shots", "Group Shots",
        "Product Interaction", "Emotion Range", "Wardrobe Changes",
        "Props Used", "Setting Changes"
    ],
    "Color & Visual Style": [
        "Color Contrast Level", "Dark Color Scheme", "Light Color Scheme",
        "Vibrant Colors", "Pastel Colors", "Monochrome Style",
        "Warm Colors", "Cool Colors", "Color Consistency",
        "Background Color Intensity", "Brand Colors Used", "Seasonal Colors",
        "Cultural Color Significance", "Gradient Usage", "B&W Filter",
        "Neon Colors", "Earth Tones", "Metallic Colors",
        "Color Saturation", "Color Temperature", "Dominant Color",
        "Secondary Color", "Accent Color", "Color Harmony", "Color Mood"
    ],
    "Video Production": [
        "Aspect Ratio", "Video Quality", "Lighting Quality", "Lighting Type",
        "Lighting Direction", "Background Type", "Background Blur",
        "Background Complexity", "Focus Quality", "Depth of Field",
        "Camera Movement", "Camera Angle", "Shot Composition",
        "Transition Style", "Transition Frequency", "Speed Changes",
        "Slow Motion", "Fast Motion", "Timelapse", "Color Filter",
        "Color Grading Style", "Special Effects", "VFX Type",
        "Screen Recording", "UGC Style", "B-Roll Footage",
        "Stock Footage", "Split Screen", "Before/After", "Picture-in-Picture",
        "Green Screen", "Motion Graphics", "3D Elements", "Lens Flare",
        "Film Grain", "Vignette Effect"
    ],
    "Text & Typography": [
        "Text Overlay Amount", "Subtitles/Captions", "Auto Captions Style",
        "Text Size", "Font Style", "Font Weight", "Text Animation",
        "Text Animation Type", "Headline Present", "Subheadline Present",
        "Caption Length", "Emojis Used", "Numbers/Stats Shown",
        "Percentage Shown", "Bullet Points", "Question Asked",
        "Urgency Language", "Scarcity Language", "Benefits Highlighted",
        "Features Listed", "Problem Stated", "Solution Presented",
        "Social Proof", "Testimonial Quote", "Price/Discount Shown",
        "Original Price Shown", "Savings Highlighted", "Free Shipping",
        "Guarantee Mentioned", "Text Contrast", "Text Background Overlay",
        "Text Shadow", "Text Outline", "Text Position", "Text Alignment"
    ],
    "Branding & Logo": [
        "Logo Placement", "Logo Position", "Logo Style", "Logo Size",
        "Logo Duration", "Logo Animation", "Brand Name Text",
        "Brand Tagline", "Brand Colors Consistency", "Brand Font Consistency",
        "Brand Consistency Score", "Brand Watermark", "Brand Sound",
        "Website URL Shown", "Social Handles Shown", "QR Code Present"
    ],
    "Call-to-Action": [
        "CTA Present", "CTA Placement", "CTA Timing", "CTA Button Visible",
        "CTA Button Color", "CTA Button Animation", "Arrow/Pointer Used",
        "Swipe Up Indicator", "Tap Animation", "CTA Visibility",
        "CTA Repetition", "CTA Clarity", "CTA Text Type", "CTA Urgency",
        "CTA Size", "CTA Contrast", "Multiple CTAs", "Verbal CTA"
    ],
    "Audio Elements": [
        "Background Music Likely", "Music Tempo", "Music Genre",
        "Music Energy Level", "Music Mood", "Trending Audio",
        "Voiceover Likely", "Voiceover Gender", "Voiceover Tone",
        "Voiceover Speed", "Natural Sound", "Sound Effects",
        "ASMR Elements", "Silence Used", "Audio Ducking", "Beat Sync"
    ],
    "Content & Messaging": [
        "Product Shown", "Product Close Up", "Product In Use",
        "Product Packaging", "Product Variety", "Unboxing Content",
        "Animated Graphics", "Infographics", "Testimonial Present",
        "Customer Review", "Star Rating", "Influencer Endorsement",
        "Expert Endorsement", "Tutorial Style", "How-To Content",
        "Demonstration", "Comparison Content", "Storytelling Approach",
        "Emotional Appeal Type", "Humor Used", "Fear/Urgency Appeal",
        "FOMO Appeal", "Educational Content", "Entertainment Value",
        "Inspirational Content", "Lifestyle Content", "Behind The Scenes",
        "Hook Strength", "Hook Type", "Opening Style", "Closing Style",
        "Pattern Interrupt", "Curiosity Gap", "Transformation Shown",
        "Results Shown", "Social Proof Type"
    ],
    "Engagement Elements": [
        "Scroll Stopping Power", "First 3 Seconds Impact", "Visual Variety",
        "Pacing Score", "Scene Changes Per 5 Sec", "Movement Intensity",
        "Eye Catching Elements", "Pattern Breaks", "Surprise Elements",
        "Interactive Elements", "Loop Potential", "Shareability Score",
        "Comment Bait", "Save Worthiness", "Rewatchability"
    ],
    "Platform Optimization": [
        "Mobile Optimized", "Vertical Format Score", "Sound Off Friendly",
        "Caption Dependency", "Thumbnail Appeal", "Feed Stopping Power",
        "Stories Format Fit", "Reels Format Fit", "Ad Format Guess",
        "Platform Native Feel"
    ],
    "Technical Metrics": [
        "Video Duration", "Frame Rate", "Resolution", "Total Frames"
    ]
}
