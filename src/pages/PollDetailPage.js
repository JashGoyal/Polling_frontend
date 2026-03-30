import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { pollAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16'];

export default function PollDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [viewers, setViewers] = useState(1);
  const [chartType, setChartType] = useState('doughnut');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch poll
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await pollAPI.getOne(id);
        setPoll(data.poll);
        setResults(data.poll.results || []);
        setTotalVotes(data.poll.totalVotes || 0);
        setUserVote(data.userVote);
      } catch {
        toast.error('Poll not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Socket room
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_poll', { pollId: id });

    socket.on('vote_update', ({ results: r, totalVotes: t, status }) => {
      setResults(r);
      setTotalVotes(t);
      if (status === 'closed') setPoll((p) => p ? { ...p, status: 'closed' } : p);
    });

    socket.on('poll_status_change', ({ status }) => {
      setPoll((p) => p ? { ...p, status } : p);
    });

    socket.on('viewer_count', ({ count }) => setViewers(count));

    return () => {
      socket.emit('leave_poll', { pollId: id });
      socket.off('vote_update');
      socket.off('poll_status_change');
      socket.off('viewer_count');
    };
  }, [socket, id]);

  // Countdown timer
  useEffect(() => {
    if (!poll?.expiresAt) return;
    const tick = () => setTimeLeft(Math.max(0, new Date(poll.expiresAt) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [poll?.expiresAt]);

  const formatTime = (ms) => {
    if (ms <= 0) return 'Expired';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleVote = async (optionId) => {
    if (userVote || poll?.status === 'closed') return;
    setVoting(true);
    try {
      const { data } = await pollAPI.vote(id, optionId);
      setUserVote(optionId);
      setResults(data.results);
      setTotalVotes(data.totalVotes);
      socket?.emit('vote_cast', { pollId: id });
      toast.success('Vote recorded! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this poll?')) return;
    try {
      await pollAPI.close(id);
      setPoll((p) => ({ ...p, status: 'closed' }));
      socket?.emit('poll_closed', { pollId: id });
      toast.success('Poll closed');
    } catch {
      toast.error('Failed to close poll');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this poll permanently?')) return;
    try {
      await pollAPI.delete(id);
      toast.success('Poll deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete poll');
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  const winnerOption = results.length > 0 ? results.reduce((a, b) => b.votes > a.votes ? b : a, results[0]) : null;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!poll) return null;

  const isCreator = user?._id === poll.creator?._id || user?._id === poll.creator;
  const hasVoted = !!userVote;
  const isClosed = poll.status === 'closed';

  // Chart data
  const chartData = {
    labels: results.map((r) => r.text),
    datasets: [{
      data: results.map((r) => r.votes),
      backgroundColor: COLORS,
      borderColor: COLORS.map((c) => c + '88'),
      borderWidth: 2,
    }],
  };

  const barData = {
    labels: results.map((r) => r.text.length > 20 ? r.text.slice(0, 20) + '...' : r.text),
    datasets: [{
      label: 'Votes',
      data: results.map((r) => r.votes),
      backgroundColor: COLORS,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Space Grotesk', size: 13 } } } },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
    },
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Back */}
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← Back to polls
        </Link>

        {/* Poll Header */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className={`badge badge-${poll.status}`}>{poll.status === 'active' ? '● Active' : '○ Closed'}</span>
                <span className={`badge badge-${poll.visibility}`}>{poll.visibility}</span>
                <span className="tag">{poll.category}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="live-dot" style={{ width: 6, height: 6 }} /> {viewers} viewing
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
                {poll.question}
              </h1>
              {poll.description && <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{poll.description}</p>}
            </div>
            {isCreator && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {poll.status === 'active' && (
                  <button className="btn btn-sm btn-secondary" onClick={handleClose}>🔒 Close</button>
                )}
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>🗑</button>
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {poll.creator?.avatar
                ? <img src={poll.creator.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                : <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                    {poll.creator?.name?.[0]}
                  </span>
              }
              {poll.creator?.name}
            </span>
            <span>🗳️ {totalVotes} total votes</span>
            <span>📋 {poll.options?.length} options</span>
            {timeLeft !== null && poll.status === 'active' && (
              <span className="countdown">⏱ {formatTime(timeLeft)}</span>
            )}
          </div>
        </div>

        {/* Winner Banner */}
        {(hasVoted || isClosed) && winnerOption && totalVotes > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.1))',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 2 }}>
                {isClosed ? 'Winner' : 'Currently Leading'}
              </div>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                {winnerOption.text} — <strong>{winnerOption.votes}</strong> votes ({winnerOption.percentage}%)
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Voting Options */}
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {hasVoted ? 'Results' : isClosed ? 'Final Results' : 'Cast Your Vote'}
            </h2>

            {poll.options?.map((opt) => {
              const result = results.find((r) => r._id?.toString() === opt._id?.toString()) || { votes: 0, percentage: 0 };
              const isSelected = userVote?.toString() === opt._id?.toString();
              const isWinner = winnerOption?._id?.toString() === opt._id?.toString() && totalVotes > 0;

              return (
                <button
                  key={opt._id}
                  className={`option-btn ${isSelected ? 'selected' : ''} ${isWinner && (hasVoted || isClosed) ? 'winner' : ''}`}
                  onClick={() => handleVote(opt._id)}
                  disabled={hasVoted || isClosed || voting}
                >
                  <div className="option-progress" style={{ width: hasVoted || isClosed ? `${result.percentage}%` : '0%' }} />
                  <div className="option-content">
                    <span>
                      {isWinner && (hasVoted || isClosed) ? '🏆 ' : ''}
                      {isSelected ? '✓ ' : ''}
                      {opt.text}
                    </span>
                    {(hasVoted || isClosed) && (
                      <span className="option-pct">{result.percentage}%</span>
                    )}
                  </div>
                </button>
              );
            })}

            {!hasVoted && !isClosed && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                👆 Click an option to vote. You can only vote once.
              </p>
            )}
            {hasVoted && <div className="alert alert-info" style={{ marginTop: 16 }}>✅ Your vote has been recorded!</div>}
            {isClosed && !hasVoted && <div className="alert alert-error" style={{ marginTop: 16 }}>🔒 This poll is closed.</div>}
          </div>

          {/* Chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>Visualization</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className={`btn btn-sm ${chartType === 'doughnut' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChartType('doughnut')}>🍩</button>
                <button className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setChartType('bar')}>📊</button>
              </div>
            </div>

            <div style={{ height: 260 }}>
              {totalVotes > 0 ? (
                chartType === 'doughnut'
                  ? <Doughnut data={chartData} options={chartOptions} />
                  : <Bar data={barData} options={barOptions} />
              ) : (
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  <div className="empty-state-icon">📊</div>
                  <div style={{ fontSize: 14 }}>No votes yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share */}
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🔗 Share this poll</h3>
          <div className="share-box">
            <span className="share-url">{window.location.href}</span>
            <button className="btn btn-sm btn-primary" onClick={copyShareLink}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
