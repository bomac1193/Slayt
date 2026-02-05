/**
 * Boveda Integration Routes
 * Endpoint for Boveda Studio to publish character content to social platforms
 */

const express = require('express');
const router = express.Router();

/**
 * Validate Boveda API key from Authorization header
 */
function authenticateBoveda(req, res, next) {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.SLAYT_API_KEY || 'slayt-dev-key';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or invalid Authorization header',
      message: 'Expected format: Authorization: Bearer YOUR_API_KEY'
    });
  }

  const providedKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (providedKey !== expectedKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key does not match'
    });
  }

  // Attach source information to request
  req.source = req.headers['x-source'] || 'unknown';
  req.bovedaRequest = true;

  next();
}

/**
 * POST /api/publish
 * Publish character content to social media platforms
 *
 * Expected payload from Boveda:
 * {
 *   character: { id, name, genome },
 *   content: { type, text, media, metadata },
 *   platforms: ['TWITTER', 'INSTAGRAM', 'TIKTOK'],
 *   settings: { scheduleTime, autoAdapt, includeHashtags, includeAttribution },
 *   source: 'boveda',
 *   timestamp: ISO string
 * }
 */
router.post('/publish', authenticateBoveda, async (req, res) => {
  try {
    const { character, content, platforms, settings, source, timestamp } = req.body;

    // Validate required fields
    if (!character || !character.id || !character.name) {
      return res.status(400).json({
        error: 'Invalid character data',
        message: 'character.id and character.name are required'
      });
    }

    if (!content || !content.text) {
      return res.status(400).json({
        error: 'Invalid content data',
        message: 'content.text is required'
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        error: 'Invalid platforms',
        message: 'platforms must be a non-empty array'
      });
    }

    // Generate character-authentic adaptations for each platform
    const adaptedContent = adaptContentToPlatforms(character, content, platforms, settings);

    // Mock publishing results (replace with actual platform API calls)
    const publishResults = {};
    for (const platform of platforms) {
      const adapted = adaptedContent[platform];

      // Simulate publishing
      publishResults[platform] = {
        status: 'success',
        postId: generateMockPostId(platform),
        url: generateMockPostUrl(platform, character.id),
        adaptedContent: adapted.content,
        scheduled: !!settings?.scheduleTime,
        scheduledFor: settings?.scheduleTime || null,
        publishedAt: settings?.scheduleTime ? null : new Date().toISOString()
      };
    }

    // Return success response
    res.json({
      publishId: `pub_${Date.now()}_${character.id}`,
      characterId: character.id,
      characterName: character.name,
      platforms: publishResults,
      source: source || 'boveda',
      timestamp: new Date().toISOString(),
      requestTimestamp: timestamp
    });

  } catch (error) {
    console.error('Boveda publish error:', error);
    res.status(500).json({
      error: 'Publishing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Adapt content to platform-specific formats using character genome
 */
function adaptContentToPlatforms(character, content, platforms, settings) {
  const genome = character.genome || {};
  const adaptations = {};

  for (const platform of platforms) {
    switch (platform) {
      case 'TWITTER':
        adaptations[platform] = adaptToTwitter(character, content, genome, settings);
        break;
      case 'INSTAGRAM':
        adaptations[platform] = adaptToInstagram(character, content, genome, settings);
        break;
      case 'TIKTOK':
        adaptations[platform] = adaptToTikTok(character, content, genome, settings);
        break;
      default:
        adaptations[platform] = {
          content: content.text,
          metadata: { platform, originalContent: true }
        };
    }
  }

  return adaptations;
}

/**
 * Twitter adaptation (280 chars, thread support)
 */
function adaptToTwitter(character, content, genome, settings) {
  let tweetText = content.text;

  // Add hashtags if enabled
  if (settings?.includeHashtags !== false) {
    const hashtags = generateHashtags(character, genome, 2);
    tweetText = `${tweetText}\n\n${hashtags.join(' ')}`;
  }

  // Add attribution if enabled
  if (settings?.includeAttribution !== false) {
    tweetText = `${tweetText}\n\n✨ Created by ${character.name}`;
  }

  // Handle character limit (create thread if needed)
  if (tweetText.length > 280) {
    const thread = createTwitterThread(tweetText);
    return {
      content: thread[0],
      metadata: {
        platform: 'TWITTER',
        isThread: true,
        threadCount: thread.length,
        fullThread: thread
      }
    };
  }

  return {
    content: tweetText.substring(0, 280),
    metadata: { platform: 'TWITTER', characterLimit: 280 }
  };
}

/**
 * Instagram adaptation (2200 char caption, visual focus)
 */
function adaptToInstagram(character, content, genome, settings) {
  let caption = content.text;

  // Add character personality flair
  const personality = genome.personality || {};
  if (personality.orisha) {
    caption = `${caption}\n\n🌟 Channeling ${personality.orisha} energy`;
  }

  // Add hashtags (Instagram allows up to 30)
  if (settings?.includeHashtags !== false) {
    const hashtags = generateHashtags(character, genome, 10);
    caption = `${caption}\n\n${hashtags.join(' ')}`;
  }

  // Add attribution
  if (settings?.includeAttribution !== false) {
    caption = `${caption}\n\n✨ ${character.name} | Powered by Boveda`;
  }

  return {
    content: caption.substring(0, 2200),
    metadata: {
      platform: 'INSTAGRAM',
      characterLimit: 2200,
      imageRequired: true,
      suggestedAspectRatio: '1:1'
    }
  };
}

/**
 * TikTok adaptation (short caption, video-focused)
 */
function adaptToTikTok(character, content, genome, settings) {
  // TikTok captions are short (150 chars)
  let caption = content.text.substring(0, 150);

  // Add trending hashtags
  if (settings?.includeHashtags !== false) {
    const hashtags = generateHashtags(character, genome, 3);
    caption = `${caption} ${hashtags.join(' ')}`.substring(0, 150);
  }

  return {
    content: caption,
    metadata: {
      platform: 'TIKTOK',
      characterLimit: 150,
      videoRequired: true,
      suggestedDuration: 15,
      videoScript: generateTikTokScript(content.text, character)
    }
  };
}

/**
 * Generate hashtags based on character genome
 */
function generateHashtags(character, genome, count) {
  const hashtags = [`#${character.name.replace(/\s+/g, '')}`];

  // Add personality-based hashtags
  if (genome.personality?.orisha) {
    hashtags.push(`#${genome.personality.orisha}`);
  }

  // Add trait-based hashtags
  if (genome.personality?.traits) {
    genome.personality.traits.slice(0, 2).forEach(trait => {
      hashtags.push(`#${trait.replace(/\s+/g, '')}`);
    });
  }

  // Generic content hashtags
  hashtags.push('#AICharacter', '#DigitalCreator', '#AIArt');

  return hashtags.slice(0, count);
}

/**
 * Create Twitter thread from long content
 */
function createTwitterThread(text) {
  const maxLength = 250; // Leave room for numbering
  const words = text.split(' ');
  const tweets = [];
  let currentTweet = '';

  for (const word of words) {
    if ((currentTweet + ' ' + word).length > maxLength) {
      tweets.push(currentTweet.trim());
      currentTweet = word;
    } else {
      currentTweet += (currentTweet ? ' ' : '') + word;
    }
  }

  if (currentTweet) {
    tweets.push(currentTweet.trim());
  }

  // Add thread numbering
  return tweets.map((tweet, i) => `${i + 1}/${tweets.length} ${tweet}`);
}

/**
 * Generate TikTok video script from content
 */
function generateTikTokScript(text, character) {
  return `[Opening Hook - 2s]
Visual: ${character.name} appears

[Main Content - 10s]
${text.substring(0, 200)}

[Call to Action - 3s]
Follow for more from ${character.name}!`;
}

/**
 * Generate mock post ID for testing
 */
function generateMockPostId(platform) {
  const prefix = {
    TWITTER: 'tw',
    INSTAGRAM: 'ig',
    TIKTOK: 'tt'
  };
  return `${prefix[platform] || 'post'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate mock post URL for testing
 */
function generateMockPostUrl(platform, characterId) {
  const domain = {
    TWITTER: 'twitter.com',
    INSTAGRAM: 'instagram.com',
    TIKTOK: 'tiktok.com'
  };
  return `https://${domain[platform]}/${characterId}/${Date.now()}`;
}

module.exports = router;
