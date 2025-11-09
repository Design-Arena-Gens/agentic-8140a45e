import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const articleCount = body.articleCount || 1;

    const agent = getAgent();
    const result = await agent.runOnce(articleCount);

    return NextResponse.json({
      success: result.status !== 'failed',
      run: result,
    });
  } catch (error: any) {
    console.error('Error running agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run agent',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const agent = getAgent();
    const status = agent.getStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get agent status',
      },
      { status: 500 }
    );
  }
}
