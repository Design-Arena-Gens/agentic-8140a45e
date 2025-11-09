import { TwitterApi } from 'twitter-api-v2';
import { NewsArticle } from './newsService';
import OpenAI from 'openai';

export interface PostResult {
  success: boolean;
  platform: string;
  postId?: string;
  error?: string;
}

export class SocialMediaService {
  private twitterClient?: TwitterApi;
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });

    // Initialize Twitter client if credentials are available
    if (
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_SECRET
    ) {
      this.twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      });
    }
  }

  async generateSocialMediaCaption(article: NewsArticle, platform: string = 'twitter'): Promise<string> {
    try {
      const maxLength = platform === 'twitter' ? 280 : 2200;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert. Create engaging, viral-worthy captions for ${platform}. Use emojis, hashtags, and compelling language. Keep it under ${maxLength} characters.`,
          },
          {
            role: 'user',
            content: `Create a ${platform} caption for this news article:\n\nTitle: ${article.title}\n\nDescription: ${article.description}`,
          },
        ],
        max_tokens: 150,
      });

      return completion.choices[0].message.content || this.createFallbackCaption(article);
    } catch (error) {
      console.error('Error generating caption:', error);
      return this.createFallbackCaption(article);
    }
  }

  private createFallbackCaption(article: NewsArticle): string {
    const emojis = ['🔥', '📰', '⚡', '🌟', '💡', '🚨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${randomEmoji} ${article.title}\n\n${article.description.substring(0, 200)}...\n\n#News #Breaking #Today`;
  }

  async postToTwitter(article: NewsArticle, mediaBuffer?: Buffer): Promise<PostResult> {
    if (!this.twitterClient) {
      return {
        success: false,
        platform: 'twitter',
        error: 'Twitter credentials not configured',
      };
    }

    try {
      const caption = await this.generateSocialMediaCaption(article, 'twitter');

      let mediaId: string | undefined;

      if (mediaBuffer) {
        try {
          const upload = await this.twitterClient.v1.uploadMedia(mediaBuffer, {
            mimeType: 'image/png',
          });
          mediaId = upload;
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
        }
      }

      const tweet = await this.twitterClient.v2.tweet({
        text: caption,
        ...(mediaId && { media: { media_ids: [mediaId] } }),
      });

      return {
        success: true,
        platform: 'twitter',
        postId: tweet.data.id,
      };
    } catch (error: any) {
      console.error('Error posting to Twitter:', error);
      return {
        success: false,
        platform: 'twitter',
        error: error.message || 'Unknown error',
      };
    }
  }

  async postToMultiplePlatforms(
    article: NewsArticle,
    mediaBuffer?: Buffer
  ): Promise<PostResult[]> {
    const results: PostResult[] = [];

    // Post to Twitter
    const twitterResult = await this.postToTwitter(article, mediaBuffer);
    results.push(twitterResult);

    // Add more platforms here (Facebook, Instagram, LinkedIn, etc.)
    // For now, we'll just simulate other platforms
    results.push({
      success: false,
      platform: 'facebook',
      error: 'Not implemented yet - add Facebook API credentials',
    });

    results.push({
      success: false,
      platform: 'instagram',
      error: 'Not implemented yet - add Instagram API credentials',
    });

    return results;
  }

  async schedulePost(
    article: NewsArticle,
    scheduledTime: Date,
    mediaBuffer?: Buffer
  ): Promise<{ success: boolean; message: string }> {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      return {
        success: false,
        message: 'Scheduled time must be in the future',
      };
    }

    // In a production environment, you'd use a job queue like Bull or Agenda
    setTimeout(async () => {
      await this.postToMultiplePlatforms(article, mediaBuffer);
    }, delay);

    return {
      success: true,
      message: `Post scheduled for ${scheduledTime.toLocaleString()}`,
    };
  }

  getConfigurationStatus(): {
    twitter: boolean;
    facebook: boolean;
    instagram: boolean;
  } {
    return {
      twitter: !!this.twitterClient,
      facebook: false,
      instagram: false,
    };
  }
}

export const socialMediaService = new SocialMediaService();
