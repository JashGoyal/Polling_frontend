import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['general', 'technology', 'sports', 'politics', 'entertainment', 'education', 'other'];

export default function CreatePollPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [form, setForm] = useState({
    question: '',
    description: '',
    options: ['', ''],
    category: 'general',
    visibility: 'public',
    expiresAt: '',
    allowAnonymous: false,
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setOption = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    setForm((f) => ({ ...f, options: opts }));
  };

  const addOption = () => {
    if (form.options.length >= 8) return toast.error('Max 8 options');
    setForm((f) => ({ ...f, options: [...f.options, ''] }));
  };

  const removeOption = (i) => {
    if (form.options.length <= 2) return toast.error('Min 2 options');
    setForm((f) => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const filledOptions = form.options.filter((o) => o.trim());
    if (filledOptions.length < 2) return setError('Please fill at least 2 options');
    if (!form.question.trim()) return setError('Question is required');

    setLoading(true);
    try {
      const payload = {
        question: form.question,
        description: form.description,
        options: filledOptions,
        category: form.category,
        visibility: form.visibility,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        allowAnonymous: form.allowAnonymous,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      const { data } = await pollAPI.create(payload);
      socket?.emit('new_poll_created', { id: data.poll._id, question: data.poll.question });
      toast.success('Poll created! 🎉');
      navigate(`/poll/${data.poll._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 className="page-title">Create a Poll</h1>
        <p className="page-subtitle">Set up your poll and share it with the world</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Question */}
          <div className="profile-section">
            <div className="profile-section-title">📝 Poll Question</div>
            <div className="form-group">
              <label className="form-label">Question *</label>
              <textarea
                className="form-input"
                placeholder="What do you want to ask?"
                value={form.question}
                onChange={(e) => set('question', e.target.value)}
                required rows={3}
                maxLength={300}
              />
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>{form.question.length}/300</div>
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="form-input"
                placeholder="Add context or details..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          </div>

          {/* Options */}
          <div className="profile-section">
            <div className="profile-section-title">🔘 Options</div>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  maxLength={150}
                />
                {form.options.length > 2 && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeOption(i)}>✕</button>
                )}
              </div>
            ))}
            {form.options.length < 8 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
                + Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="profile-section">
            <div className="profile-section-title">⚙️ Settings</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select className="form-input" value={form.visibility} onChange={(e) => set('visibility', e.target.value)}>
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">⏱ Expires At (optional)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🏷 Tags (comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="react, tech, design"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.allowAnonymous}
                onChange={(e) => set('allowAnonymous', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Allow anonymous voting (hide voter identities)</span>
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              {loading ? 'Creating...' : '🚀 Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
