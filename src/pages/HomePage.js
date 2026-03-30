import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'general', 'technology', 'sports', 'politics', 'entertainment', 'education', 'other'];

function PollCard({ poll }) {
  const top = poll.results?.reduce((a, b) => (b.votes > a.votes ? b : a), poll.results?.[0]);
  const timeLeft = poll.expiresAt ? Math.max(0, new Date(poll.expiresAt) - Date.now()) : null;

  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}d left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  };

  return (
    <Link to={`/poll/${poll._id}`} className="poll-card">
      <div className="poll-card-header">
        <div className="poll-card-question">{poll.question}</div>
        <span className={`badge badge-${poll.status}`}>
          {poll.status === 'active' ? '● Active' : '○ Closed'}
        </span>
      </div>

      {poll.description && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
          {poll.description.slice(0, 100)}{poll.description.length > 100 ? '...' : ''}
        </p>
      )}

      {/* Mini results */}
      <div style={{ marginBottom: 12 }}>
        {(poll.results || []).slice(0, 3).map((opt) => (
          <div key={opt._id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
              <span style={{ color: opt._id === top?._id ? 'var(--success)' : 'var(--text-secondary)' }}>
                {opt._id === top?._id && poll.totalVotes > 0 ? '🏆 ' : ''}{opt.text}
              </span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{opt.percentage}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: opt._id === top?._id ? 'var(--success)' : 'var(--accent)',
                width: `${opt.percentage}%`, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        ))}
        {poll.options?.length > 3 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            +{poll.options.length - 3} more options
          </div>
        )}
      </div>

      <div className="poll-card-meta">
        <div className="poll-card-author">
          {poll.creator?.avatar
            ? <img src={poll.creator.avatar} alt="" />
            : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                {poll.creator?.name?.[0]}
              </div>
          }
          {poll.creator?.name}
        </div>
        <span className="poll-meta-item">🗳️ {poll.totalVotes} votes</span>
        <span className="poll-meta-item">📋 {poll.options?.length} options</span>
        {timeLeft !== null && poll.status === 'active' && (
          <span className="countdown">⏱ {formatTime(timeLeft)}</span>
        )}
        <span className={`badge badge-${poll.visibility}`}>{poll.visibility}</span>
        <span className="tag">{poll.category}</span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { socket } = useSocket();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { data } = await pollAPI.getAll({ page, category: category !== 'all' ? category : '', status, search });
      setPolls(data.polls);
      setTotalPages(data.pagination.pages);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolls(); }, [page, category, status, search]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_poll_available', () => { fetchPolls(); toast('📊 New poll available!'); });
    return () => socket.off('new_poll_available');
  }, [socket]);

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Live Polls</h1>
            <p className="page-subtitle">
              <span className="live-dot" /> &nbsp;Real-time voting — results update instantly
            </p>
          </div>
          <Link to="/create-poll" className="btn btn-primary">
            + Create Poll
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search polls..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
          />
          <select className="form-input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className="form-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ maxWidth: 140 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Polls grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div className="spinner" />
          </div>
        ) : polls.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗳️</div>
            <div className="empty-state-title">No polls found</div>
            <p>Be the first to <Link to="/create-poll" style={{ color: 'var(--accent)' }}>create a poll</Link></p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {polls.map((poll) => <PollCard key={poll._id} poll={poll} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className="btn btn-sm"
                style={{ background: p === page ? 'var(--accent)' : undefined, color: p === page ? '#fff' : undefined }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
