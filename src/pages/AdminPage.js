import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Small helpers ────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'indigo' }) => {
    const colors = {
        green: 'bg-green-500/20 text-green-400 border-green-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30',
        indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
            {children}
        </span>
    );
};

const StatCard = ({ icon, label, value, sub, color = '#6366f1' }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9' }}>{value?.toLocaleString()}</div>
        {sub && <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
);

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) => {
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#1e1e3a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 32, maxWidth: 420, width: '90%' }}>
                <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: danger ? '#ef4444' : '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Users', 'Polls'];

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            toast.error('Admin access only');
            navigate('/');
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') return null;

    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#f1f5f9', paddingTop: 80 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🛡️ Admin Panel
                    </h1>
                    <p style={{ color: '#64748b', marginTop: 4 }}>Manage users, polls, and platform health</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 32 }}>
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            style={{
                                padding: '8px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                                background: activeTab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                                color: activeTab === t ? '#fff' : '#94a3b8'
                            }}>
                            {t}
                        </button>
                    ))}
                </div>

                {activeTab === 'Overview' && <OverviewTab />}
                {activeTab === 'Users' && <UsersTab />}
                {activeTab === 'Polls' && <PollsTab />}
            </div>
        </div>
    );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/admin/stats`),
            axios.get(`${API_URL}/admin/activity`),
        ]).then(([s, a]) => {
            setStats(s.data.stats);
            setActivity(a.data);
        }).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>Loading stats...</div>;
    if (!stats) return null;

    return (
        <div>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
                <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersThisWeek} this week`} color="#6366f1" />
                <StatCard icon="🚫" label="Blocked Users" value={stats.blockedUsers} color="#ef4444" />
                <StatCard icon="📊" label="Total Polls" value={stats.totalPolls} sub={`+${stats.newPollsThisWeek} this week`} color="#8b5cf6" />
                <StatCard icon="✅" label="Active Polls" value={stats.activePolls} color="#10b981" />
                <StatCard icon="🔒" label="Closed Polls" value={stats.closedPolls} color="#f59e0b" />
                <StatCard icon="🗳️" label="Total Votes" value={stats.totalVotes} color="#06b6d4" />
            </div>

            {/* Category breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>📂 Polls by Category</h3>
                    {stats.categoryStats.map((c) => (
                        <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <span style={{ color: '#94a3b8', width: 100, fontSize: 13, textTransform: 'capitalize' }}>{c._id}</span>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${Math.min(100, (c.count / stats.totalPolls) * 100)}%`, height: 8, background: 'linear-gradient(90deg,#6366f1,#a78bfa)', borderRadius: 4 }} />
                            </div>
                            <span style={{ color: '#64748b', fontSize: 12, width: 32, textAlign: 'right' }}>{c.count}</span>
                        </div>
                    ))}
                </div>

                {/* Recent new users */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>🆕 Recent Users</h3>
                    {activity?.recentUsers?.slice(0, 6).map((u) => (
                        <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                                {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                                <div style={{ color: '#64748b', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                            </div>
                            {u.isBlocked && <Badge color="red">Blocked</Badge>}
                            {u.role === 'admin' && <Badge color="indigo">Admin</Badge>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [blockReason, setBlockReason] = useState('');
    const [showBlockInput, setShowBlockInput] = useState(null);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/admin/users`, {
                params: { page, limit: 12, search, status: statusFilter },
            });
            setUsers(data.users);
            setPagination(data.pagination);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, [search, statusFilter]);

    useEffect(() => { fetchUsers(1); }, [fetchUsers]);

    const handleBlock = async (userId, reason) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/users/${userId}/block`, { reason });
            toast.success(data.message);
            setShowBlockInput(null);
            setBlockReason('');
            fetchUsers(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleUnblock = async (userId) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/users/${userId}/unblock`);
            toast.success(data.message);
            fetchUsers(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/users/${userId}/role`, { role });
            toast.success(data.message);
            fetchUsers(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (userId) => {
        try {
            const { data } = await axios.delete(`${API_URL}/admin/users/${userId}`);
            toast.success(data.message);
            setConfirm(null);
            fetchUsers(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    return (
        <div>
            <ConfirmModal
                open={!!confirm}
                title="Delete User"
                message={`Permanently delete "${confirm?.name}" and all their polls? This cannot be undone.`}
                onConfirm={() => handleDelete(confirm._id)}
                onCancel={() => setConfirm(null)}
                confirmText="Delete"
                danger
            />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email…"
                    style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14 }} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a2e', color: '#f1f5f9', fontSize: 14, cursor: 'pointer' }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>

            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{pagination.total} users found</div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {users.map((u) => (
                        <div key={u._id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${u.isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                {/* Avatar */}
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.avatar ? 'transparent' : 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                                    {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.name?.[0]?.toUpperCase()}
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{u.name}</span>
                                        {u.role === 'admin' && <Badge color="indigo">Admin</Badge>}
                                        {u.isBlocked ? <Badge color="red">Blocked</Badge> : <Badge color="green">Active</Badge>}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{u.email}</div>
                                    {u.isBlocked && u.blockedReason && (
                                        <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>Reason: {u.blockedReason}</div>
                                    )}
                                    <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                                        {u.pollCount} polls · Joined {new Date(u.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {/* Role toggle */}
                                    {u.role !== 'admin' ? (
                                        <button onClick={() => handleRoleChange(u._id, 'admin')}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Make Admin
                                        </button>
                                    ) : (u.email === sessionStorage.getItem('user-email') ?
                                        (<></>) :
                                        (
                                            <button onClick={() => handleRoleChange(u._id, 'user')}
                                                //   disabled={false}
                                                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                                                Remove Admin
                                            </button>
                                        ))}
                                    {/* Block/Unblock */}
                                    {u.isBlocked ? (
                                        <button onClick={() => handleUnblock(u._id)}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Unblock
                                        </button>
                                    ) : (
                                        <button onClick={() => setShowBlockInput(showBlockInput === u._id ? null : u._id)}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Block
                                        </button>
                                    )}
                                    {/* Delete */}
                                    {u.role !== 'admin' && (
                                        <button onClick={() => setConfirm(u)}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Block reason input */}
                            {showBlockInput === u._id && (
                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                                        placeholder="Reason for blocking (optional)…"
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)', color: '#f1f5f9', fontSize: 13 }} />
                                    <button onClick={() => handleBlock(u._id, blockReason)}
                                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                        Confirm Block
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => fetchUsers(p)}
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                background: pagination.page === p ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                                color: pagination.page === p ? '#fff' : '#94a3b8'
                            }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── POLLS TAB ────────────────────────────────────────────────────────────────
function PollsTab() {
    const [polls, setPolls] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [confirm, setConfirm] = useState(null);

    const CATEGORIES = ['all', 'general', 'technology', 'sports', 'politics', 'entertainment', 'education', 'other'];

    const fetchPolls = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/admin/polls`, {
                params: { page, limit: 10, search, status: statusFilter, category: categoryFilter },
            });
            setPolls(data.polls);
            setPagination(data.pagination);
        } catch { toast.error('Failed to load polls'); }
        finally { setLoading(false); }
    }, [search, statusFilter, categoryFilter]);

    useEffect(() => { fetchPolls(1); }, [fetchPolls]);

    const handleClose = async (id) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/polls/${id}/close`);
            toast.success(data.message);
            fetchPolls(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleReopen = async (id) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/polls/${id}/reopen`);
            toast.success(data.message);
            fetchPolls(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleVisibility = async (id) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/polls/${id}/visibility`);
            toast.success(data.message);
            fetchPolls(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        try {
            const { data } = await axios.delete(`${API_URL}/admin/polls/${id}`);
            toast.success(data.message);
            setConfirm(null);
            fetchPolls(pagination.page);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    return (
        <div>
            <ConfirmModal
                open={!!confirm}
                title="Delete Poll"
                message={`Permanently delete this poll and all its votes? This cannot be undone.`}
                onConfirm={() => handleDelete(confirm)}
                onCancel={() => setConfirm(null)}
                confirmText="Delete Poll"
                danger
            />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search polls…"
                    style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 14 }} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a2e', color: '#f1f5f9', fontSize: 14, cursor: 'pointer' }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#1a1a2e', color: '#f1f5f9', fontSize: 14, cursor: 'pointer' }}>
                    {CATEGORIES.map((c) => <option key={c} value={c === 'all' ? '' : c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
            </div>

            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{pagination.total} polls found</div>

            {loading ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {polls.map((p) => (
                        <div key={p._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                        <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>{p.question}</span>
                                        <Badge color={p.status === 'active' ? 'green' : 'gray'}>{p.status}</Badge>
                                        <Badge color={p.visibility === 'public' ? 'indigo' : 'yellow'}>{p.visibility}</Badge>
                                        <Badge color="gray">{p.category}</Badge>
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 12 }}>
                                        By <span style={{ color: '#94a3b8' }}>{p.creator?.name}</span> · {p.totalVotes} votes · {p.options?.length} options · {new Date(p.createdAt).toLocaleDateString()}
                                        {p.expiresAt && ` · Expires ${new Date(p.expiresAt).toLocaleDateString()}`}
                                    </div>
                                    {/* Mini vote bar */}
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                        {p.results?.slice(0, 3).map((r) => (
                                            <div key={r._id} style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '2px 8px' }}>
                                                {r.text.length > 20 ? r.text.slice(0, 20) + '…' : r.text} — {r.percentage}%
                                            </div>
                                        ))}
                                        {p.results?.length > 3 && <div style={{ fontSize: 11, color: '#475569', padding: '2px 4px' }}>+{p.results.length - 3} more</div>}
                                    </div>
                                </div>
                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    {p.status === 'active' ? (
                                        <button onClick={() => handleClose(p._id)}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Close Poll
                                        </button>
                                    ) : (
                                        <button onClick={() => handleReopen(p._id)}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                            Reopen
                                        </button>
                                    )}
                                    <button onClick={() => handleVisibility(p._id)}
                                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: 12 }}>
                                        {p.visibility === 'public' ? 'Make Private' : 'Make Public'}
                                    </button>
                                    <button onClick={() => setConfirm(p._id)}
                                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => fetchPolls(p)}
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                background: pagination.page === p ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                                color: pagination.page === p ? '#fff' : '#94a3b8'
                            }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}