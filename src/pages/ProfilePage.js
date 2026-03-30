import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    occupation: user?.occupation || '',
    website: user?.website || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account information</p>

        {/* Avatar + info */}
        <div className="profile-section" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--accent)' }} />
            : <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 700, color: '#fff',
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
          }
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge ${user?.authProvider === 'google' ? 'badge-active' : 'badge-public'}`}>
                {user?.authProvider === 'google' ? '🔵 Google' : '📧 Email'}
              </span>
              <span className="badge badge-public">{user?.role}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <div className="profile-section-title">Basic Information</div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell us about yourself..." value={form.bio} onChange={(e) => set('bio', e.target.value)} maxLength={200} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{form.bio.length}/200</div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Details</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">📍 Location</label>
                <input type="text" className="form-input" placeholder="City, Country" value={form.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">💼 Occupation</label>
                <input type="text" className="form-input" placeholder="Your job title" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">🌐 Website</label>
              <input type="url" className="form-input" placeholder="https://yoursite.com" value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
