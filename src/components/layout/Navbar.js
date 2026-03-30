import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropRef = useRef();
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }) => `navbar-link${isActive ? ' active' : ''}`;

  return (
    <>
      <style>{`
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }
        .hamburger span {
          display: block;
          width: 18px;
          height: 2px;
          background: #94a3b8;
          border-radius: 2px;
          transition: all 0.25s;
        }
        .hamburger.open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .hamburger.open span:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .hamburger.open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }
        .mobile-menu {
          display: none;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          background: var(--bg-card, #1a1a2e);
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          padding: 12px 16px 16px;
          z-index: 199;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .mobile-menu.open {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 10px;
          color: var(--text-secondary, #94a3b8);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: rgba(99,102,241,0.12);
          color: #a5b4fc;
        }
        .mobile-divider {
          height: 1px;
          background: var(--border, rgba(255,255,255,0.08));
          margin: 8px 0;
        }
        .mobile-user-info {
          padding: 12px 16px 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mobile-user-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #f1f5f9);
        }
        .mobile-user-email {
          font-size: 12px;
          color: var(--text-muted, #64748b);
        }
        @media (max-width: 768px) {
          .hamburger { display: flex !important; }
          .navbar-links { display: none !important; }
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">🗳️</div>
            VotePulse
          </Link>

          {/* Desktop nav links */}
          <div className="navbar-links">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            <NavLink to="/create-poll" className={navLinkClass}>+ Create Poll</NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 8, padding: '4px 12px' }}>
                🛡️ Admin
              </NavLink>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar dropdown (desktop) */}
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

            {/* Hamburger (mobile only) */}
            <div ref={menuRef}>
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-user-info">
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase()}</div>
          }
          <div>
            <div className="mobile-user-name">{user?.name}</div>
            <div className="mobile-user-email">{user?.email}</div>
          </div>
        </div>

        <div className="mobile-divider" />

        <NavLink to="/" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} end onClick={closeMenu}>🏠 Home</NavLink>
        <NavLink to="/create-poll" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>➕ Create Poll</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>📊 Dashboard</NavLink>
        <NavLink to="/profile" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>👤 Profile</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            🛡️ Admin Panel
          </NavLink>
        )}

        <div className="mobile-divider" />

        <button onClick={() => { handleLogout(); closeMenu(); }} style={{
          display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px',
          borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.08)',
          color: '#f87171', cursor: 'pointer', fontSize: 15, fontWeight: 500,
          fontFamily: 'inherit', textAlign: 'left', gap: 8,
        }}>
          🚪 Logout
        </button>
      </div>
    </>
  );
}