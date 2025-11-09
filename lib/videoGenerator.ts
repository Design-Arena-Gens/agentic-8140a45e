import sharp from 'sharp';
import { NewsArticle } from './newsService';
import OpenAI from 'openai';

export interface VideoFrame {
  buffer: Buffer;
  duration: number;
}

export class VideoGenerator {
  private openai: OpenAI;
  private width = 1280;
  private height = 720;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    });
  }

  async generateVideoScript(article: NewsArticle): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional news video script writer. Create engaging, concise video scripts (60-90 seconds) that are perfect for social media. Make them exciting and informative.',
          },
          {
            role: 'user',
            content: `Write a short, engaging video script about this news article:\n\nTitle: ${article.title}\n\nDescription: ${article.description}\n\nFormat the script with clear sections for narration.`,
          },
        ],
        max_tokens: 500,
      });

      return completion.choices[0].message.content || article.description;
    } catch (error) {
      console.error('Error generating script:', error);
      return article.description;
    }
  }

  async generateVideoFrames(article: NewsArticle): Promise<VideoFrame[]> {
    const frames: VideoFrame[] = [];
    const script = await this.generateVideoScript(article);

    // Split script into segments for multiple frames
    const segments = this.splitScriptIntoSegments(script, 3);

    for (let i = 0; i < segments.length; i++) {
      const frame = await this.createFrame(
        article.title,
        segments[i],
        i,
        segments.length
      );
      frames.push({
        buffer: frame,
        duration: 3000, // 3 seconds per frame
      });
    }

    return frames;
  }

  private async createFrame(
    title: string,
    content: string,
    frameIndex: number,
    totalFrames: number
  ): Promise<Buffer> {
    // Create SVG with text
    const svg = `
      <svg width="${this.width}" height="${this.height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${this.width}" height="${this.height}" fill="url(#grad)"/>
        <rect width="${this.width}" height="20" fill="#00fff5"/>
        <text x="${this.width / 2}" y="150" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">${this.escapeXml(title.substring(0, 50))}</text>
        <text x="${this.width / 2}" y="400" font-size="32" fill="#e0e0e0" text-anchor="middle">${this.escapeXml(content.substring(0, 100))}</text>
        <text x="${this.width / 2}" y="${this.height - 100}" font-size="24" fill="#00fff5" text-anchor="middle">${frameIndex + 1} / ${totalFrames}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private splitScriptIntoSegments(script: string, numSegments: number): string[] {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    const segments: string[] = [];
    const sentencesPerSegment = Math.ceil(sentences.length / numSegments);

    for (let i = 0; i < numSegments; i++) {
      const start = i * sentencesPerSegment;
      const end = Math.min(start + sentencesPerSegment, sentences.length);
      const segment = sentences.slice(start, end).join(' ').trim();
      if (segment) {
        segments.push(segment);
      }
    }

    return segments.length > 0 ? segments : [script];
  }

  async generateThumbnail(article: NewsArticle): Promise<Buffer> {
    const titleText = this.escapeXml(article.title.substring(0, 80));

    const svg = `
      <svg width="1280" height="720">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#bgGrad)"/>
        <rect width="1280" height="720" fill="rgba(0,0,0,0.4)"/>
        <rect x="40" y="40" width="300" height="80" fill="#ff0000"/>
        <text x="190" y="95" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">BREAKING NEWS</text>
        <text x="640" y="360" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">${titleText}</text>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

export const videoGenerator = new VideoGenerator();
