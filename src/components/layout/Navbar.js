import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">🗳️</div>
          VotePulse
        </Link>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`} end>
            Home
          </NavLink>
          <NavLink to="/create-poll" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            + Create Poll
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '4px 12px' }}>
              🛡️ Admin
            </NavLink>
          )}
        </div>

        <div className="navbar-actions" ref={dropRef}>
          <div onClick={() => setDropOpen(!dropOpen)} style={{ position: 'relative', cursor: 'pointer' }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="navbar-avatar" />
              : <div className="navbar-avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
            }
            {dropOpen && (
              <div style={{
                position: 'absolute', top: '44px', right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: 'var(--shadow)',
                zIndex: 200,
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <Link to="/profile" onClick={() => setDropOpen(false)} style={{
                  display: 'block', padding: '8px 12px', borderRadius: '8px',
                  color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  👤 Profile
                </Link>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '8px 12px', borderRadius: '8px',
                  color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '14px', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}