import { NextRequest, NextResponse } from 'next/server';
import { getAgent, createAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    const agent = getAgent();

    if (action === 'start') {
      if (config) {
        agent.updateConfig(config);
      }
      agent.startScheduled();

      return NextResponse.json({
        success: true,
        message: 'Scheduled agent started',
        status: agent.getStatus(),
      });
    } else if (action === 'stop') {
      agent.stopScheduled();

      return NextResponse.json({
        success: true,
        message: 'Scheduled agent stopped',
        status: agent.getStatus(),
      });
    } else if (action === 'update') {
      if (config) {
        agent.updateConfig(config);
      }

      return NextResponse.json({
        success: true,
        message: 'Agent configuration updated',
        status: agent.getStatus(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "start", "stop", or "update"',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error managing scheduled agent:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to manage scheduled agent',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const agent = getAgent();
    const status = agent.getStatus();
    const history = agent.getRunHistory(5);

    return NextResponse.json({
      success: true,
      status,
      recentRuns: history,
    });
  } catch (error: any) {
    console.error('Error getting scheduled agent status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get scheduled agent status',
      },
      { status: 500 }
    );
  }
}
