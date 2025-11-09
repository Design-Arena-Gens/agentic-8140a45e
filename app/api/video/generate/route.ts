import { NextRequest, NextResponse } from 'next/server';
import { videoGenerator } from '@/lib/videoGenerator';
import { NewsArticle } from '@/lib/newsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const article: NewsArticle = body.article;

    if (!article || !article.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid article data',
        },
        { status: 400 }
      );
    }

    // Generate thumbnail
    const thumbnail = await videoGenerator.generateThumbnail(article);

    // Generate script
    const script = await videoGenerator.generateVideoScript(article);

    // Return base64 encoded image
    const thumbnailBase64 = thumbnail.toString('base64');

    return NextResponse.json({
      success: true,
      thumbnail: `data:image/png;base64,${thumbnailBase64}`,
      script,
    });
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate video',
      },
      { status: 500 }
    );
  }
}
