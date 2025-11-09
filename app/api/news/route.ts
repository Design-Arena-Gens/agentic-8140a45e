import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '@/lib/newsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '5');

    let articles;

    if (category) {
      articles = await newsService.getArticlesByCategory(category);
    } else {
      articles = await newsService.fetchLatestNews(limit);
    }

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch news',
      },
      { status: 500 }
    );
  }
}
