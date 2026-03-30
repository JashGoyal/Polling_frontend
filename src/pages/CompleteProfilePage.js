import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfilePage() {
  const { user, completeProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    bio: '',
    location: '',
    occupation: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeProfile(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await completeProfile({ bio: '', location: '', occupation: '', website: '' });
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        {/* Welcome header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--accent)', marginBottom: 16 }} />
            : <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
          }
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎉 Welcome to VotePulse
          </div>
          <h1 className="auth-title" style={{ marginBottom: 4 }}>Complete your profile</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Hi <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>! Tell us a bit about yourself.
          </p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              className="form-input"
              placeholder="A short intro about yourself..."
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3}
              maxLength={200}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
              {form.bio.length}/200
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">📍 Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label">💼 Occupation</label>
              <input
                type="text"
                className="form-input"
                placeholder="Software Engineer"
                value={form.occupation}
                onChange={(e) => set('occupation', e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">🌐 Website / LinkedIn</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://yoursite.com"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile →'}
            </button>
          </div>
        </form>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
