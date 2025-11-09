import { newsService, NewsArticle } from './newsService';
import { videoGenerator } from './videoGenerator';
import { socialMediaService, PostResult } from './socialMediaService';
import cron from 'node-cron';

export interface AgentConfig {
  autoPost: boolean;
  interval: string; // cron expression
  category?: string;
  maxArticlesPerRun: number;
}

export interface AgentRun {
  id: string;
  timestamp: Date;
  articles: NewsArticle[];
  results: PostResult[];
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

export class NewsVideoAgent {
  private config: AgentConfig;
  private isRunning: boolean = false;
  private cronJob?: cron.ScheduledTask;
  private runHistory: AgentRun[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async runOnce(articleCount: number = 1): Promise<AgentRun> {
    const runId = `run-${Date.now()}`;
    const timestamp = new Date();

    console.log(`[${runId}] Starting agent run...`);

    try {
      // Step 1: Fetch news articles
      console.log(`[${runId}] Fetching latest news...`);
      const articles = this.config.category
        ? await newsService.getArticlesByCategory(this.config.category)
        : await newsService.fetchLatestNews(articleCount);

      if (articles.length === 0) {
        throw new Error('No articles found');
      }

      console.log(`[${runId}] Found ${articles.length} articles`);

      // Step 2: Process each article
      const results: PostResult[] = [];

      for (const article of articles.slice(0, articleCount)) {
        console.log(`[${runId}] Processing: ${article.title}`);

        try {
          // Generate video frames/thumbnail
          console.log(`[${runId}] Generating video content...`);
          const thumbnail = await videoGenerator.generateThumbnail(article);

          // Post to social media
          console.log(`[${runId}] Posting to social media...`);
          const postResults = await socialMediaService.postToMultiplePlatforms(
            article,
            thumbnail
          );

          results.push(...postResults);

          console.log(
            `[${runId}] Posted successfully: ${postResults.filter(r => r.success).length}/${postResults.length} platforms`
          );
        } catch (error: any) {
          console.error(`[${runId}] Error processing article:`, error);
          results.push({
            success: false,
            platform: 'unknown',
            error: error.message,
          });
        }
      }

      // Determine overall status
      const successCount = results.filter(r => r.success).length;
      const status =
        successCount === 0
          ? 'failed'
          : successCount < results.length
          ? 'partial'
          : 'success';

      const run: AgentRun = {
        id: runId,
        timestamp,
        articles: articles.slice(0, articleCount),
        results,
        status,
      };

      this.runHistory.push(run);
      console.log(`[${runId}] Agent run completed with status: ${status}`);

      return run;
    } catch (error: any) {
      console.error(`[${runId}] Agent run failed:`, error);

      const run: AgentRun = {
        id: runId,
        timestamp,
        articles: [],
        results: [],
        status: 'failed',
        error: error.message,
      };

      this.runHistory.push(run);
      return run;
    }
  }

  startScheduled(): void {
    if (this.isRunning) {
      console.log('Agent is already running');
      return;
    }

    console.log(`Starting scheduled agent with cron: ${this.config.interval}`);

    this.cronJob = cron.schedule(this.config.interval, async () => {
      console.log('Cron job triggered');
      await this.runOnce(this.config.maxArticlesPerRun);
    });

    this.isRunning = true;
  }

  stopScheduled(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('Scheduled agent stopped');
    }
  }

  getStatus(): {
    isRunning: boolean;
    config: AgentConfig;
    lastRun?: AgentRun;
    totalRuns: number;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastRun: this.runHistory[this.runHistory.length - 1],
      totalRuns: this.runHistory.length,
    };
  }

  getRunHistory(limit: number = 10): AgentRun[] {
    return this.runHistory.slice(-limit).reverse();
  }

  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isRunning) {
      this.stopScheduled();
      this.startScheduled();
    }
  }
}

// Global agent instance
let globalAgent: NewsVideoAgent | null = null;

export function getAgent(): NewsVideoAgent {
  if (!globalAgent) {
    globalAgent = new NewsVideoAgent({
      autoPost: false,
      interval: '0 */6 * * *', // Every 6 hours
      maxArticlesPerRun: 1,
    });
  }
  return globalAgent;
}

export function createAgent(config: AgentConfig): NewsVideoAgent {
  globalAgent = new NewsVideoAgent(config);
  return globalAgent;
}
