'use client';

import { useState, useEffect } from 'react';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface AgentStatus {
  isRunning: boolean;
  config: {
    autoPost: boolean;
    interval: string;
    maxArticlesPerRun: number;
  };
  lastRun?: {
    id: string;
    timestamp: string;
    status: string;
    articles: NewsArticle[];
    results: any[];
  };
  totalRuns: number;
}

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchNews();
    fetchAgentStatus();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news?limit=10');
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent/schedule');
      const data = await response.json();
      if (data.success) {
        setAgentStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const generateVideo = async (article: NewsArticle) => {
    setLoading(true);
    setSelectedArticle(article);
    setMessage(null);

    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });

      const data = await response.json();

      if (data.success) {
        setThumbnail(data.thumbnail);
        setScript(data.script);
        setMessage({ type: 'success', text: 'Video generated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate video' });
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setMessage({ type: 'error', text: 'Failed to generate video' });
    } finally {
      setLoading(false);
    }
  };

  const postToSocial = async () => {
    if (!selectedArticle || !thumbnail) return;

    setPosting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: selectedArticle,
          media: thumbnail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successCount = data.results.filter((r: any) => r.success).length;
        setMessage({
          type: 'success',
          text: `Posted to ${successCount} platform(s) successfully!`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to post' });
      }
    } catch (error) {
      console.error('Error posting to social media:', error);
      setMessage({ type: 'error', text: 'Failed to post to social media' });
    } finally {
      setPosting(false);
    }
  };

  const runAgentOnce = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleCount: 1 }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Agent ran successfully! Check the results below.',
        });
        fetchAgentStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Agent run failed' });
      }
    } catch (error) {
      console.error('Error running agent:', error);
      setMessage({ type: 'error', text: 'Failed to run agent' });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduledAgent = async () => {
    if (!agentStatus) return;

    const action = agentStatus.isRunning ? 'stop' : 'start';

    try {
      const response = await fetch('/api/agent/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setAgentStatus(data.status);
        setMessage({
          type: 'success',
          text: `Scheduled agent ${action === 'start' ? 'started' : 'stopped'}`,
        });
      }
    } catch (error) {
      console.error('Error toggling scheduled agent:', error);
      setMessage({ type: 'error', text: 'Failed to toggle scheduled agent' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🤖 News Video Agent
          </h1>
          <p className="text-xl text-gray-300">
            Automated news to video to social media pipeline
          </p>
        </header>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">📰 Fetch News</h3>
            <p className="text-gray-300 mb-4">From Google News RSS</p>
            <button
              onClick={fetchNews}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh News
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">🎬 Generate Video</h3>
            <p className="text-gray-300 mb-4">AI-powered thumbnails</p>
            <button
              onClick={runAgentOnce}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Agent Once'}
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">📱 Auto-Post</h3>
            <p className="text-gray-300 mb-4">
              {agentStatus?.isRunning ? '🟢 Active' : '🔴 Inactive'}
            </p>
            <button
              onClick={toggleScheduledAgent}
              className={`w-full ${
                agentStatus?.isRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-bold py-2 px-4 rounded`}
            >
              {agentStatus?.isRunning ? 'Stop Scheduler' : 'Start Scheduler'}
            </button>
          </div>
        </div>

        {agentStatus?.lastRun && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              📊 Last Agent Run
            </h2>
            <div className="text-gray-300">
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`font-bold ${
                    agentStatus.lastRun.status === 'success'
                      ? 'text-green-400'
                      : agentStatus.lastRun.status === 'partial'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {agentStatus.lastRun.status.toUpperCase()}
                </span>
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {new Date(agentStatus.lastRun.timestamp).toLocaleString()}
              </p>
              <p>
                <strong>Articles Processed:</strong>{' '}
                {agentStatus.lastRun.articles.length}
              </p>
              <p>
                <strong>Posts:</strong> {agentStatus.lastRun.results.filter((r) => r.success).length}/
                {agentStatus.lastRun.results.length} successful
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              📰 Latest News
            </h2>
            <div className="space-y-4">
              {articles.map((article, index) => (
                <div
                  key={index}
                  className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 cursor-pointer transition-all ${
                    selectedArticle?.title === article.title
                      ? 'ring-2 ring-blue-500'
                      : 'hover:bg-white/20'
                  }`}
                  onClick={() => setSelectedArticle(article)}
                >
                  <h3 className="text-lg font-bold text-white mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    {article.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {article.source}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateVideo(article);
                      }}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded disabled:opacity-50"
                    >
                      Generate Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-6">
              🎬 Generated Content
            </h2>

            {selectedArticle ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {selectedArticle.title}
                </h3>

                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white mt-4">Generating video...</p>
                  </div>
                )}

                {thumbnail && !loading && (
                  <>
                    <img
                      src={thumbnail}
                      alt="Generated thumbnail"
                      className="w-full rounded-lg mb-4"
                    />

                    {script && (
                      <div className="bg-black/30 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-bold mb-2">
                          📝 Video Script
                        </h4>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {script}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={postToSocial}
                      disabled={posting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50"
                    >
                      {posting ? 'Posting...' : '📱 Post to Social Media'}
                    </button>
                  </>
                )}

                {!thumbnail && !loading && (
                  <p className="text-gray-400 text-center py-12">
                    Click &quot;Generate Video&quot; to create content
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
                <p className="text-gray-400 text-center py-12">
                  Select an article to generate video content
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-400">
          <p className="mb-2">
            Configure API keys in .env file for full functionality
          </p>
          <p className="text-sm">
            OPENAI_API_KEY • TWITTER_API_KEY • NEWS_API_KEY (optional)
          </p>
        </footer>
      </div>
    </div>
  );
}
