const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

/**
 * AI Service for content analysis, scoring, and suggestions
 * This service integrates with OpenAI's GPT-4 Vision and other AI models
 * to provide intelligent content recommendations
 */

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseURL = 'https://api.openai.com/v1';
    this.publicBaseURL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  /**
   * Analyze content comprehensively
   */
  async analyzeContent(content, context = {}) {
    try {
      const [
        viralityScore,
        engagementScore,
        aestheticScore,
        trendScore,
        creatorInsights
      ] = await Promise.all([
        this.calculateViralityScore(content),
        this.calculateEngagementScore(content),
        this.calculateAestheticScore(content),
        this.calculateTrendScore(content),
        this.generateCreatorInsights(content, context)
      ]);

      const suggestions = await this.generateSuggestions(content, creatorInsights, context);

      return {
        viralityScore,
        engagementScore,
        aestheticScore,
        trendScore,
        suggestions,
        creatorInsights
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate virality score (0-100)
   * Factors: visual appeal, timing, trend alignment, shareability
   */
  async calculateViralityScore(content) {
    try {
      // If OpenAI API key is not set, use heuristic scoring
      if (!this.openaiApiKey) {
        return this.heuristicViralityScore(content);
      }

      const prompt = `Analyze this social media content for virality potential. Consider:
1. Visual appeal and eye-catching elements
2. Emotional resonance
3. Shareability factor
4. Trend alignment
5. Content uniqueness

Platform: ${content.platform}
Caption: ${content.caption || 'No caption'}
Media Type: ${content.mediaType}

Rate the virality potential from 0-100, where 100 is extremely viral.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Virality score error:', error);
      return this.heuristicViralityScore(content);
    }
  }

  /**
   * Calculate engagement score (0-100)
   * Factors: caption quality, hashtags, call-to-action, posting time
   */
  async calculateEngagementScore(content) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicEngagementScore(content);
      }

      const prompt = `Analyze this social media content for engagement potential. Consider:
1. Caption effectiveness and call-to-action
2. Hashtag relevance and quality
3. Content relevance to target audience
4. Interaction triggers (questions, polls, etc.)
5. Authenticity and relatability

Platform: ${content.platform}
Caption: ${content.caption || 'No caption'}
Hashtags: ${content.hashtags?.join(', ') || 'None'}
Media Type: ${content.mediaType}

Rate the engagement potential from 0-100.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Engagement score error:', error);
      return this.heuristicEngagementScore(content);
    }
  }

  /**
   * Calculate aesthetic score (0-100)
   * Factors: composition, colors, lighting, visual quality
   */
  async calculateAestheticScore(content) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicAestheticScore(content);
      }

      const prompt = `Analyze this ${content.mediaType} for aesthetic quality. Consider:
1. Composition and framing
2. Color harmony and contrast
3. Lighting quality
4. Visual clarity and sharpness
5. Overall professional appearance

Platform: ${content.platform}
Aspect Ratio: ${content.metadata?.aspectRatio || 'Unknown'}

Rate the aesthetic quality from 0-100.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Aesthetic score error:', error);
      return this.heuristicAestheticScore(content);
    }
  }

  /**
   * Calculate trend score (0-100)
   * Factors: current trends, hashtag popularity, seasonal relevance
   */
  async calculateTrendScore(content) {
    try {
      // Trend analysis based on hashtags and timing
      let score = 50; // Base score

      if (content.hashtags && content.hashtags.length > 0) {
        // Reward optimal hashtag count
        if (content.hashtags.length >= 5 && content.hashtags.length <= 15) {
          score += 20;
        }

        // Check for trending indicators (simplified)
        const trendingKeywords = ['viral', 'trending', '2024', '2025', 'fyp', 'explore'];
        const hasTrendingHashtags = content.hashtags.some(tag =>
          trendingKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        );
        if (hasTrendingHashtags) score += 20;
      }

      // Time-based scoring (simplified)
      const dayOfWeek = new Date().getDay();
      const hour = new Date().getHours();

      // Best posting times (simplified)
      if ((dayOfWeek >= 1 && dayOfWeek <= 5) && (hour >= 9 && hour <= 21)) {
        score += 10;
      }

      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Trend score error:', error);
      return 50;
    }
  }

  /**
   * Generate comprehensive suggestions
   */
  async generateSuggestions(content, creatorInsights = null, context = {}) {
    try {
      const contentType = await this.suggestContentType(content, creatorInsights, context);
      const targetAudience = context.creatorProfile?.targetAudience || 'General audience';
      const hashtags = await this.generateHashtags(content, 10);
      const platformRec = creatorInsights?.platformRecommendation || {};

      return {
        recommendedType: contentType.type,
        reason: contentType.reason,
        improvements: contentType.improvements || [],
        bestTimeToPost: this.suggestBestPostingTime(content),
        targetAudience,
        hashtagSuggestions: hashtags,
        confidenceScore: contentType.confidence,
        platformRecommendation: platformRec.platform,
        platformConfidence: platformRec.confidence,
        platformReason: platformRec.rationale,
        captionIdeas: creatorInsights?.captionIdeas || [],
        hookIdeas: creatorInsights?.hookIdeas || contentType.hookIdeas || [],
        actionItems: creatorInsights?.actionItems || [],
        similarCreators: creatorInsights?.similarCreators || [],
        creatorInsights
      };
    } catch (error) {
      console.error('Suggestions error:', error);
      return {
        recommendedType: content.mediaType,
        reason: 'Unable to generate suggestions',
        improvements: [],
        confidenceScore: 0
      };
    }
  }

  /**
   * Suggest best content type (post, carousel, reel, story)
   */
  async suggestContentType(content, creatorInsights = null, context = {}) {
    try {
      const profile = this.normalizeCreatorProfile(context.creatorProfile);
      const aspectRatio = content.metadata?.aspectRatio;
      const mediaType = content.mediaType;
      const platform = creatorInsights?.platformRecommendation?.platform || profile.platformFocus?.[0] || content.platform;
      const platformKey = (platform || '').toLowerCase();

      let recommendedType = 'post';
      let reason = '';
      let confidence = 70;
      let improvements = [];
      const hookIdeas = [];
      const goalText = (profile.goals || '').toLowerCase();
      const longFormCaption = content.caption && content.caption.length > 400;

      if (mediaType === 'video') {
        if (platformKey === 'instagram') {
          recommendedType = aspectRatio?.includes('9:16') ? 'reel' : 'video';
          reason = aspectRatio?.includes('9:16')
            ? 'Your vertical framing is reel-ready and reels over-index on reach for your niche.'
            : 'A standard feed video will preserve your cinematic framing without trimming.';
          confidence = aspectRatio?.includes('9:16') ? 95 : 78;
          hookIdeas.push(
            aspectRatio?.includes('9:16')
              ? 'Open with a kinetic beat + on-screen text (“STOP scrolling if…”) to grab Reels viewers.'
              : 'Start with a cinematic crop + bold overlay (“Note to self:”) before revealing the product.'
          );
        } else if (platformKey === 'tiktok') {
          recommendedType = 'vertical-video';
          reason = 'TikTok rewards fast hooks and vertical pacing—lean into it for trend lift.';
          confidence = 92;
          hookIdeas.push('Cold open with a POV statement (“POV: you’re done playing small”) and cut straight into action.');
        } else if (platformKey === 'youtube' || platformKey === 'youtube shorts') {
          recommendedType = 'short';
          reason = 'Repurpose this cut as a YouTube Short to earn incremental impressions.';
          confidence = 80;
          hookIdeas.push('Promise the payoff within 2 seconds (“In 30 seconds you’ll know how to…”)');
        } else if (platformKey === 'twitch') {
          recommendedType = 'stream-highlight';
          reason = 'Turn this into a Twitch highlight/short to drive watchers into your live room.';
          confidence = 88;
          hookIdeas.push('Start with the punchline (“I can’t believe chat dared me to…”) before rewinding.');
          improvements.push('Caption the first five seconds so muted viewers stay hooked.');
        } else if (platformKey === 'twitter' || platformKey === 'x') {
          recommendedType = 'quote-tweet-video';
          reason = 'Lead with a spicy one-liner, then embed the clip for X/Twitter scrollers.';
          confidence = 80;
          hookIdeas.push('First tweet: “Unpopular opinion: ____” then drop the clip underneath.');
        }
      } else if (mediaType === 'image') {
        const isSquareOrPortrait = aspectRatio === '1:1' || aspectRatio === '4:5';
        if (isSquareOrPortrait && !longFormCaption) {
          recommendedType = 'single-post';
          reason = 'Clean single posts dominate saves for your aesthetic-heavy feed.';
          confidence = 82;
          hookIdeas.push('Overlay a minimalist headline (“Note to self: ____”) that mirrors your warm editorial vibe.');
        }
        if (longFormCaption || goalText.includes('teach') || goalText.includes('educat')) {
          recommendedType = 'carousel';
          reason = 'Carousel storytelling matches your educational goals and boosts dwell time.';
          confidence = 88;
          improvements.push('Chunk this story into 4-6 cards with one takeaway per frame.');
           hookIdeas.push('Card 1 headline: “3 things I wish I knew before ____” with a subtle motion underline.');
        }
        if (profile.tastes?.toLowerCase().includes('behind the scenes')) {
          improvements.push('Add a BTS slide or short clip for extra authenticity.');
        }
        if (platformKey === 'pinterest') {
          recommendedType = 'idea-pin';
          reason = 'Pinterest Idea Pins or carousels thrive on mood-board ready visuals.';
          confidence = 86;
          hookIdeas.push('Frame 1: “Pin this before your next creative sprint 🔖”.');
        } else if (platformKey === 'onlyfans') {
          recommendedType = 'exclusive-gallery';
          reason = 'An exclusive gallery with a story-driven caption keeps OnlyFans subscribers retained.';
          confidence = 90;
          hookIdeas.push('Tease the payoff: “Slide 5 is the moment everyone kept DM’ing me about…”');
          improvements.push('Include a CTA pointing to the gated set.');
        } else if (platformKey === 'twitter' || platformKey === 'x') {
          recommendedType = 'thread';
          reason = 'Break this visual into a 3-tweet thread—first tweet grabs, second tweet gives context, third drives action.';
          confidence = 82;
          hookIdeas.push('Tweet 1: “Threads no one asked for but absolutely need 👇”.');
        }
      } else if (platformKey === 'onlyfans') {
        recommendedType = 'exclusive-drop';
        reason = 'Behind-the-scenes video + gallery fits your subscriber-only drop cadence.';
        confidence = 90;
        hookIdeas.push('“Tonight’s afterparty lives here first. Slide in before it disappears.”');
      } else if (platformKey === 'twitch') {
        recommendedType = 'live-segment';
        reason = 'Frame this as a live segment or raid moment and promote the stream schedule.';
        confidence = 84;
        hookIdeas.push('“Live in five—bring your questions, I’m spilling everything.”');
      } else if (platformKey === 'pinterest') {
        recommendedType = 'story-pin';
        reason = 'Story Pins keep Pinterest users swiping through your aesthetic shots.';
        confidence = 83;
        hookIdeas.push('“Save this palette for your next mood board.”');
      }

      // Additional improvements
      if (!content.caption || content.caption.length < 50) {
        improvements.push('Add a more detailed caption to increase engagement');
      }

      if (!content.hashtags || content.hashtags.length < 5) {
        improvements.push('Add 5-15 relevant hashtags to increase discoverability');
      }

      return {
        type: recommendedType,
        reason,
        confidence,
        improvements,
        alternatives: this.getAlternativeTypes(recommendedType, platform),
        hookIdeas
      };
    } catch (error) {
      console.error('Content type suggestion error:', error);
      return {
        type: content.mediaType,
        reason: 'Unable to analyze',
        confidence: 50,
        alternatives: []
      };
    }
  }

  /**
   * Generate relevant hashtags
   */
  async generateHashtags(content, count = 20) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicHashtags(content, count);
      }

      const prompt = `Return exactly ${count} Instagram-ready hashtags (no sentences, no preamble, no explanation, no code fences).
Use # with each tag. Do NOT add any other text.
Base it on:
- Platform: ${content.platform || 'instagram'}
- Caption/Title: ${content.caption || content.title || 'n/a'}
- Media Type: ${content.mediaType || 'image'}
- If details are sparse, default to high-signal creative/fashion/music culture, but stay concise.
Output format: #tag1 #tag2 #tag3 ... #tag${count}`;

      const response = await this.callOpenAI(prompt);
      const hashtags = response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      return hashtags.slice(0, count);
    } catch (error) {
      console.error('Hashtag generation error:', error);
      return this.heuristicHashtags(content, count);
    }
  }

  /**
   * Generate caption variations
   */
  async generateCaption(content, options = {}) {
    try {
      const { tone = 'casual', length = 'medium', creatorProfile = null, tasteContext = null } = options;

      if (!this.openaiApiKey) {
        return ['Caption generation requires OpenAI API key'];
      }

      const profile = this.normalizeCreatorProfile(creatorProfile);
      const lengthGuide = {
        short: '1-2 sentences',
        medium: '3-5 sentences',
        long: '6-10 sentences'
      };

      const taste = tasteContext || {};
      const lexicon = taste.lexicon || { prefer: [], avoid: [] };

      const prompt = `Generate 3 engaging social media captions for this content:

Platform: ${content.platform}
Media Type: ${content.mediaType}
Tone: ${tone}
Length: ${lengthGuide[length] || lengthGuide.medium}
Current Caption: ${content.caption || 'None'}
Creator Niche: ${profile.niche}
Voice & Vibe: ${profile.voice}
Audience: ${profile.targetAudience}
Goals: ${profile.goals}
Taste Glyph: ${taste.glyph || 'VOID'}
Archetype Confidence: ${taste.confidence || 0}
Preferred Lexicon: ${lexicon.prefer.join(', ') || 'minimal, authoritative'}
Avoid Lexicon: ${lexicon.avoid.join(', ') || 'generic, clickbait'}

Requirements:
- ${tone} tone
- ${lengthGuide[length]} length
- Always reflect the Taste Glyph and stay on-brand
- Use preferred lexicon; avoid banned terms and generic templates
- No placeholders, no cliches; be specific to the archetype and niche

Provide 3 variations separated by "---"`;

      const response = await this.callOpenAI(prompt);
      const captions = response.split('---').map(c => c.trim()).filter(c => c.length > 0);

      return captions;
    } catch (error) {
      console.error('Caption generation error:', error);
      return ['Unable to generate captions'];
    }
  }

  /**
   * Analyze version and score it
   */
  async analyzeVersion(version) {
    // Simplified version scoring
    return {
      viralityScore: Math.floor(Math.random() * 30) + 60, // 60-90
      engagementScore: Math.floor(Math.random() * 30) + 60,
      aestheticScore: Math.floor(Math.random() * 30) + 60,
      trendScore: Math.floor(Math.random() * 30) + 60,
      overallScore: Math.floor(Math.random() * 30) + 65
    };
  }

  /**
   * Suggest best posting time
   */
  suggestBestPostingTime(content) {
    const platformKey = (content.platform || 'instagram').toLowerCase();

    const bestTimes = {
      instagram: [
        'Weekdays 11AM-1PM',
        'Weekdays 7PM-9PM',
        'Wednesday 11AM',
        'Friday 10AM-11AM'
      ],
      tiktok: [
        'Tuesday 9AM',
        'Thursday 12PM',
        'Friday 5AM',
        'Weekdays 6PM-10PM'
      ],
      twitter: [
        'Weekdays 7AM-9AM',
        'Weekdays 11AM',
        'Sunday 8PM-10PM'
      ],
      twitch: [
        'Thursday 6PM-10PM',
        'Saturday 2PM-6PM',
        'Late-night (midnight-2AM) for global raids'
      ],
      pinterest: [
        'Saturday 8PM-11PM',
        'Sunday 9-11AM',
        'Weekdays 2PM-4PM'
      ],
      onlyfans: [
        'Weekdays 9PM-1AM',
        'Friday midnight drops',
        'Sunday 3PM (tease upcoming set)'
      ]
    };

    const times = bestTimes[platformKey] || bestTimes.instagram;
    return times[Math.floor(Math.random() * times.length)];
  }

  getMediaUrl(relativePath) {
    if (!relativePath) return null;
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    return `${this.publicBaseURL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }

  normalizeCreatorProfile(profile = {}) {
    const defaults = {
      niche: 'Modern lifestyle creator',
      voice: 'Optimistic, expert mentor',
      aesthetic: 'Editorial, minimal, warm neutrals',
      goals: 'Grow an engaged community and drive meaningful conversions',
      targetAudience: 'Ambitious creatives and founders',
      tastes: 'Slow luxury, cinematic color grading, high-energy hooks',
      inspiration: [],
      platformFocus: ['instagram', 'tiktok']
    };

    const normalized = {
      ...defaults,
      ...(profile || {})
    };

    normalized.inspiration = Array.isArray(normalized.inspiration)
      ? normalized.inspiration.filter(Boolean)
      : this.parseCommaList(normalized.inspiration || normalized.inspirationHandles);

    normalized.platformFocus = Array.isArray(normalized.platformFocus) && normalized.platformFocus.length
      ? normalized.platformFocus
      : defaults.platformFocus;

    return normalized;
  }

  parseCommaList(value) {
    if (!value || typeof value !== 'string') return [];
    return value
      .split(',')
      .map(token => token.replace(/[@#]/g, '').trim())
      .filter(Boolean);
  }

  /**
   * Build detailed creator-fit insights with multimodal AI when available
   */
  async generateCreatorInsights(content, context = {}) {
    const profile = this.normalizeCreatorProfile(context.creatorProfile);

    if (!this.openaiApiKey) {
      return this.heuristicCreatorInsights(content, profile);
    }

    try {
      const mediaUrl = this.getMediaUrl(content.mediaUrl);
      const systemPrompt = 'You are a senior social media strategist who audits creator content, benchmarking it against top-performing influencers in the same niche.';
      const analysisInstructions = `Use the supplied creator profile and media to:
- Evaluate how the visual and caption align with their niche, tastes, and goals.
- Benchmark against similar creators (invent realistic examples if you cannot look them up) and explain how their posts performed.
- Decide which platform (Instagram, TikTok, YouTube Shorts, Pinterest, Twitter/X, Twitch, or OnlyFans) this specific post will perform best on, and explain why.
- Suggest fresh hooks/caption ideas grounded in the creator's tone.
- Provide concrete action items to improve the asset before publishing.

Respond strictly as JSON with the following schema:
{
  "platformRecommendation": { "platform": string, "rationale": string, "confidence": number },
  "nicheAlignment": { "score": number, "notes": string, "strengths": [string], "gaps": [string] },
  "similarCreators": [{ "name": string, "handle": string, "overlap": string, "performanceNote": string }],
  "captionIdeas": [string],
  "hookIdeas": [string],
  "actionItems": [string]
}`;

      const userContent = [
        {
          type: 'text',
          text: `Creator Profile:
- Niche: ${profile.niche}
- Goals: ${profile.goals}
- Brand Voice: ${profile.voice}
- Aesthetic: ${profile.aesthetic}
- Tastes / keywords: ${profile.tastes}
- Target audience: ${profile.targetAudience}
- Inspiration accounts: ${profile.inspiration.join(', ') || 'None'}
- Preferred platforms: ${profile.platformFocus.join(', ')}

Content Details:
- Platform intent: ${content.platform}
- Media type: ${content.mediaType}
- Caption: ${content.caption || 'No caption yet'}
- Hashtags: ${(content.hashtags || []).join(', ') || 'None'}
${context.campaignNotes ? `- Campaign notes: ${context.campaignNotes}` : ''}`
        }
      ];

      if (mediaUrl) {
        userContent.push({
          type: 'image_url',
          image_url: { url: mediaUrl }
        });
      }

      const response = await this.callOpenAIMultimodal([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
        { role: 'user', content: analysisInstructions }
      ], true);

      const parsed = JSON.parse(response);
      return this.formatCreatorInsights(parsed, profile);
    } catch (error) {
      console.error('Creator insights error:', error.response?.data || error.message);
      return this.heuristicCreatorInsights(content, this.normalizeCreatorProfile(context.creatorProfile));
    }
  }

  formatCreatorInsights(raw = {}, profile = {}) {
    const recommendation = {
      platform: raw.platformRecommendation?.platform || profile.platformFocus?.[0] || 'instagram',
      rationale: raw.platformRecommendation?.rationale || raw.platformRecommendation?.reason || 'Optimized for your current platform focus.',
      confidence: raw.platformRecommendation?.confidence || 70
    };

    const sanitizeCreatives = Array.isArray(raw.similarCreators)
      ? raw.similarCreators.map((creator, index) => ({
          name: creator.name || `Creator ${index + 1}`,
          handle: creator.handle || '',
          overlap: creator.overlap || 'Shares similar audience and tone',
          performanceNote: creator.performanceNote || creator.performance || 'Consistently outperforms platform benchmarks.'
        }))
      : [];

    return {
      platformRecommendation: recommendation,
      nicheAlignment: {
        score: raw.nicheAlignment?.score || raw.nicheAlignment?.value || 72,
        notes: raw.nicheAlignment?.notes || raw.nicheAlignment?.summary || 'Solid niche alignment. Keep emphasizing signature motifs.',
        strengths: raw.nicheAlignment?.strengths || raw.nicheAlignment?.matchedTraits || [profile.aesthetic],
        gaps: raw.nicheAlignment?.gaps || raw.nicheAlignment?.opportunities || ['Clarify the storytelling arc in the caption.']
      },
      similarCreators: sanitizeCreatives,
      captionIdeas: Array.isArray(raw.captionIdeas) ? raw.captionIdeas : [],
      hookIdeas: Array.isArray(raw.hookIdeas) ? raw.hookIdeas : [],
      actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : ['Lead with a stronger hook in the first 3 seconds.']
    };
  }

  heuristicCreatorInsights(content, profile) {
    const platform = profile.platformFocus?.[0] || content.platform || 'instagram';
    const lower = (value, fallback = '') => (value || fallback).toLowerCase();
    const niche = lower(profile.niche, 'your niche');
    const audience = lower(profile.targetAudience, 'your people');
    const aesthetic = lower(profile.aesthetic, 'signature aesthetic');
    const voice = lower(profile.voice, 'mentor');
    const goals = profile.goals || 'create obsession';

    const captionIdeas = [
      `Swipe-worthy peek into ${niche} — remind ${audience} why it matters right now.`,
      `Take them behind the scenes of your ${aesthetic} mood + drop a tip they can steal tonight.`,
      `My hot take as a ${voice} voice: ${goals}. Save it, test it, report back.`
    ];

    const inspo = (profile.inspiration && profile.inspiration.length ? profile.inspiration : ['creativecurator'])
      .slice(0, 3)
      .map(handle => ({
        name: handle.replace(/^[^a-zA-Z]+/, '') || 'Influencer',
        handle: `@${handle}`,
        overlap: `Shares similar ${profile.aesthetic.toLowerCase()} aesthetic`,
        performanceNote: 'Posts that lean into storytelling carousels outperform baseline engagement by ~18%.'
      }));

    return {
      platformRecommendation: {
        platform,
        rationale: `Your ${profile.aesthetic.toLowerCase()} visuals and ${profile.voice.toLowerCase()} tone already resonate with ${platform}.`,
        confidence: 70
      },
      nicheAlignment: {
        score: 70,
        notes: `Visual language fits ${profile.niche.toLowerCase()}, but reinforce your goals (${profile.goals}) in the caption.`,
        strengths: [profile.aesthetic, profile.voice],
        gaps: ['Add clear CTA and mention outcomes for the audience.']
      },
      similarCreators: inspo,
      captionIdeas,
      hookIdeas: [
        `POV: ${audience} finally ${goals.toLowerCase()}.`,
        `“If you're into ${niche}, screenshot this before the algorithm buries it.”`,
        `First line: “Dear ${audience}, here’s the ${aesthetic} mood board you begged for.”`
      ],
      actionItems: [
        'Add 1-2 trend-backed hooks in the first line.',
        `Reference your audience (${profile.targetAudience}) directly to boost saves.`,
        'Test a carousel or short-form video variant to see if retention climbs.'
      ]
    };
  }

  // Helper methods

  async callOpenAI(prompt) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.openaiBaseURL}/chat/completions`,
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert social media strategist and content analyst.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async callOpenAIMultimodal(messages, jsonResponse = false) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const payload = {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.35,
      max_tokens: 900
    };

    if (jsonResponse) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await axios.post(
      `${this.openaiBaseURL}/chat/completions`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  async getAIScore(prompt, content) {
    const response = await this.callOpenAI(prompt);
    const score = parseInt(response.trim());
    return isNaN(score) ? 50 : score;
  }

  // Heuristic fallback methods (when AI is not available)

  heuristicViralityScore(content) {
    let score = 50;

    if (content.mediaType === 'video') score += 20;
    if (content.caption && content.caption.length > 100) score += 10;
    if (content.hashtags && content.hashtags.length >= 5) score += 15;
    if (content.metadata?.aspectRatio === '9:16') score += 5;

    return Math.min(100, score);
  }

  heuristicEngagementScore(content) {
    let score = 50;

    if (content.caption) score += 15;
    if (content.caption && content.caption.includes('?')) score += 10; // Has question
    if (content.hashtags && content.hashtags.length >= 5) score += 15;
    if (content.location) score += 10;

    return Math.min(100, score);
  }

  heuristicAestheticScore(content) {
    let score = 60;

    if (content.metadata?.width >= 1080) score += 20;
    if (content.metadata?.aspectRatio === '1:1' || content.metadata?.aspectRatio === '4:5') score += 10;

    return Math.min(100, score);
  }

  heuristicHashtags(content, count) {
    const genericHashtags = [
      'instagood', 'photooftheday', 'instagram', 'love', 'instagood',
      'fashion', 'style', 'photography', 'art', 'beautiful',
      'picoftheday', 'nature', 'happy', 'cute', 'travel',
      'followme', 'like4like', 'instadaily', 'repost', 'summer'
    ];

    return genericHashtags.slice(0, count);
  }

  getAlternativeTypes(recommendedType, platform) {
    const alternatives = {
      instagram: ['post', 'carousel', 'reel', 'story'],
      tiktok: ['video', 'live']
    };

    const options = alternatives[platform] || alternatives.instagram;
    return options.filter(type => type !== recommendedType);
  }

  /**
   * Get optimal posting times with heatmap data
   */
  async getOptimalTiming(platform = 'instagram') {
    const platformKey = platform.toLowerCase();

    // Generate heatmap data (7 days x 24 hours)
    // Higher values indicate better engagement times
    const heatmapData = this.generateTimingHeatmap(platformKey);

    // Find best posting windows
    const bestWindows = this.findBestWindows(heatmapData, platformKey);

    // Generate insights
    const insights = this.generateTimingInsights(platformKey);

    // Get peak hours
    const peakHours = this.findPeakHours(heatmapData);

    return {
      platform: platformKey,
      heatmapData,
      bestWindows,
      insights,
      peakHours,
    };
  }

  generateTimingHeatmap(platform) {
    const basePatterns = {
      instagram: {
        weekdayPeak: [9, 10, 11, 12, 13, 19, 20, 21],
        weekendPeak: [10, 11, 12, 13, 14, 15, 19, 20],
        lowHours: [0, 1, 2, 3, 4, 5, 6],
      },
      tiktok: {
        weekdayPeak: [7, 8, 9, 12, 15, 19, 20, 21, 22],
        weekendPeak: [9, 10, 11, 14, 15, 16, 20, 21, 22],
        lowHours: [0, 1, 2, 3, 4, 5],
      },
      twitter: {
        weekdayPeak: [8, 9, 10, 11, 12, 17, 18],
        weekendPeak: [9, 10, 11, 12, 19, 20],
        lowHours: [0, 1, 2, 3, 4, 5, 6],
      },
      youtube: {
        weekdayPeak: [12, 13, 14, 15, 16, 17, 20, 21],
        weekendPeak: [10, 11, 12, 14, 15, 16, 17, 20, 21],
        lowHours: [0, 1, 2, 3, 4, 5, 6, 7],
      },
      pinterest: {
        weekdayPeak: [14, 15, 16, 20, 21, 22],
        weekendPeak: [10, 11, 20, 21, 22],
        lowHours: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
    };

    const pattern = basePatterns[platform] || basePatterns.instagram;
    const heatmap = [];

    for (let day = 0; day < 7; day++) {
      const dayData = [];
      const isWeekend = day >= 5;
      const peakHours = isWeekend ? pattern.weekendPeak : pattern.weekdayPeak;

      for (let hour = 0; hour < 24; hour++) {
        let baseValue = 30 + Math.random() * 15;

        if (pattern.lowHours.includes(hour)) {
          baseValue = 5 + Math.random() * 15;
        } else if (peakHours.includes(hour)) {
          baseValue = 70 + Math.random() * 30;
        }

        // Add some variance
        const variance = (Math.random() - 0.5) * 10;
        dayData.push(Math.round(Math.max(0, Math.min(100, baseValue + variance))));
      }
      heatmap.push(dayData);
    }

    return heatmap;
  }

  findBestWindows(heatmapData, platform) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const windows = [];

    // Find top 3 time slots
    const slots = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        slots.push({
          day,
          hour,
          value: heatmapData[day][hour],
        });
      }
    }

    slots.sort((a, b) => b.value - a.value);
    const topSlots = slots.slice(0, 4);

    topSlots.forEach((slot, index) => {
      const labels = ['Best', 'Second Best', 'Third Best', 'Fourth Best'];
      const hourLabel = slot.hour === 0 ? '12 AM' :
        slot.hour < 12 ? `${slot.hour} AM` :
        slot.hour === 12 ? '12 PM' : `${slot.hour - 12} PM`;

      windows.push({
        label: labels[index],
        time: `${days[slot.day]} ${hourLabel}`,
        engagement: Math.round(slot.value - 50),
      });
    });

    return windows;
  }

  generateTimingInsights(platform) {
    const platformInsights = {
      instagram: [
        'Posting during lunch hours (11AM-1PM) tends to drive higher engagement',
        'Evening posts (7PM-9PM) perform well as users wind down',
        'Wednesday tends to be the highest engagement day',
        'Avoid posting between 3AM-6AM in your target timezone',
      ],
      tiktok: [
        'TikTok users are most active during evening hours (7PM-11PM)',
        'Early morning posts (7AM-9AM) can catch users during commute',
        'Weekends see extended engagement windows',
        'Thursday and Friday tend to have the highest viral potential',
      ],
      twitter: [
        'Morning hours (8AM-10AM) are prime for news and updates',
        'Lunch break tweets (12PM-1PM) see high engagement',
        'Avoid late night posting unless targeting international audiences',
        'Weekday engagement typically outperforms weekends',
      ],
      youtube: [
        'Afternoon uploads (2PM-4PM) allow time for algorithm distribution',
        'Evening hours (8PM-9PM) are peak viewing times',
        'Weekend content should be uploaded Friday afternoon',
        'Consistency in posting schedule improves algorithmic favor',
      ],
      pinterest: [
        'Evening pins (8PM-11PM) perform best as users browse for inspiration',
        'Weekend afternoons see increased activity',
        'Saturday is the highest engagement day',
        'Seasonal content should be pinned 45 days in advance',
      ],
    };

    return platformInsights[platform] || platformInsights.instagram;
  }

  findPeakHours(heatmapData) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const peakHours = [];

    for (let day = 0; day < 7; day++) {
      let maxHour = 0;
      let maxValue = 0;

      for (let hour = 0; hour < 24; hour++) {
        if (heatmapData[day][hour] > maxValue) {
          maxValue = heatmapData[day][hour];
          maxHour = hour;
        }
      }

      const hourLabel = maxHour === 0 ? '12 AM' :
        maxHour < 12 ? `${maxHour} AM` :
        maxHour === 12 ? '12 PM' : `${maxHour - 12} PM`;

      peakHours.push({
        day: days[day],
        time: hourLabel,
        score: maxValue,
      });
    }

    return peakHours;
  }
}

module.exports = new AIService();
