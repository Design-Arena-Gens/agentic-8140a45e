import { NextRequest, NextResponse } from 'next/server';
import { socialMediaService } from '@/lib/socialMediaService';
import { NewsArticle } from '@/lib/newsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const article: NewsArticle = body.article;
    const mediaBase64: string | undefined = body.media;

    if (!article || !article.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid article data',
        },
        { status: 400 }
      );
    }

    let mediaBuffer: Buffer | undefined;
    if (mediaBase64) {
      // Remove data URL prefix if present
      const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, '');
      mediaBuffer = Buffer.from(base64Data, 'base64');
    }

    const results = await socialMediaService.postToMultiplePlatforms(article, mediaBuffer);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error posting to social media:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to post to social media',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = socialMediaService.getConfigurationStatus();
  return NextResponse.json({
    success: true,
    platforms: status,
  });
}
