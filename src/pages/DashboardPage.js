import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI, pollAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [myPolls, setMyPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, pollsRes] = await Promise.all([userAPI.getDashboard(), pollAPI.getMine()]);
        setStats(dashRes.data.stats);
        setMyPolls(pollsRes.data.polls);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (pollId) => {
    if (!window.confirm('Delete this poll?')) return;
    try {
      await pollAPI.delete(pollId);
      setMyPolls((p) => p.filter((x) => x._id !== pollId));
      toast.success('Poll deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleClose = async (pollId) => {
    try {
      await pollAPI.close(pollId);
      setMyPolls((p) => p.map((x) => x._id === pollId ? { ...x, status: 'closed' } : x));
      toast.success('Poll closed');
    } catch {
      toast.error('Failed to close');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
          </div>
          <Link to="/create-poll" className="btn btn-primary">+ Create Poll</Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid-3" style={{ marginBottom: 32 }}>
            <div className="stat-card">
              <div className="stat-value">{stats.totalPollsCreated}</div>
              <div className="stat-label">Polls Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalVotesReceived}</div>
              <div className="stat-label">Total Votes Received</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.activePollsCount}</div>
              <div className="stat-label">Active Polls</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['overview', 'my-polls'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                transition: 'all 0.2s', marginBottom: -1,
              }}>
              {t === 'overview' ? '📊 Overview' : '🗳️ My Polls'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recent Polls</h2>
            {myPolls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <div className="empty-state-title">No polls yet</div>
                <Link to="/create-poll" className="btn btn-primary" style={{ marginTop: 16 }}>Create your first poll</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {myPolls.slice(0, 5).map((poll) => (
                  <div key={poll._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={`badge badge-${poll.status}`}>{poll.status}</span>
                        <span className="tag">{poll.category}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{poll.question}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {poll.totalVotes} votes · {poll.options?.length} options · {new Date(poll.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/poll/${poll._id}`} className="btn btn-sm btn-secondary">View</Link>
                      {poll.status === 'active' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleClose(poll._id)}>Close</button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(poll._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'my-polls' && (
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>All My Polls ({myPolls.length})</h2>
            {myPolls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <div className="empty-state-title">No polls yet</div>
                <Link to="/create-poll" className="btn btn-primary" style={{ marginTop: 16 }}>Create your first poll</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {myPolls.map((poll) => (
                  <div key={poll._id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span className={`badge badge-${poll.status}`}>{poll.status}</span>
                          <span className={`badge badge-${poll.visibility}`}>{poll.visibility}</span>
                          <span className="tag">{poll.category}</span>
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{poll.question}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {poll.totalVotes} votes · {new Date(poll.createdAt).toLocaleDateString()}
                          {poll.expiresAt && ` · Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/poll/${poll._id}`} className="btn btn-sm btn-secondary">View</Link>
                        {poll.status === 'active' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => handleClose(poll._id)}>🔒 Close</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(poll._id)}>🗑</button>
                      </div>
                    </div>

                    {/* Mini results */}
                    {(poll.results || []).map((opt) => (
                      <div key={opt._id} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{opt.text}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{opt.votes} ({opt.percentage}%)</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                          <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${opt.percentage}%`, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
