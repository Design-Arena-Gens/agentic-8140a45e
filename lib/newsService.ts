import Parser from 'rss-parser';
import axios from 'axios';

export interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  content?: string;
}

const parser = new Parser();

export class NewsService {
  private googleNewsRSSFeeds = [
    'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Technology
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Business
  ];

  async fetchLatestNews(limit: number = 5): Promise<NewsArticle[]> {
    try {
      const allArticles: NewsArticle[] = [];

      for (const feedUrl of this.googleNewsRSSFeeds) {
        try {
          const feed = await parser.parseURL(feedUrl);

          const articles = feed.items.slice(0, limit).map(item => ({
            title: item.title || '',
            description: this.cleanDescription(item.contentSnippet || item.description || ''),
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: item.creator || feed.title || 'Google News',
            content: item.content || item.contentSnippet || item.description || '',
          }));

          allArticles.push(...articles);
        } catch (err) {
          console.error(`Error fetching feed ${feedUrl}:`, err);
        }
      }

      // Remove duplicates and sort by date
      const uniqueArticles = this.removeDuplicates(allArticles);
      return uniqueArticles.slice(0, limit);
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  async fetchTrendingTopics(): Promise<NewsArticle[]> {
    try {
      const feed = await parser.parseURL(
        'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en'
      );

      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        description: this.cleanDescription(item.contentSnippet || item.description || ''),
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        source: item.creator || 'Google News',
        content: item.content || '',
      }));
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      throw error;
    }
  }

  private cleanDescription(description: string): string {
    // Remove HTML tags and extra whitespace
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getArticlesByCategory(category: string): Promise<NewsArticle[]> {
    const categoryFeeds: { [key: string]: string } = {
      technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
      business: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
      world: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
      sports: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
      entertainment: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    };

    const feedUrl = categoryFeeds[category.toLowerCase()] || this.googleNewsRSSFeeds[0];

    try {
      const feed = await parser.parseURL(feedUrl);
      return feed.items.slice(0, 10).map(item => ({
        title: item.title || '',
        description: this.cleanDescription(item.contentSnippet || item.description || ''),
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        source: item.creator || 'Google News',
        content: item.content || '',
      }));
    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      throw error;
    }
  }
}

export const newsService = new NewsService();
