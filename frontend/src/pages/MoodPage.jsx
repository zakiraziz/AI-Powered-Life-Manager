import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { Card, PageHeader, CardTitle, Button, Spinner, EmptyState } from '../components/UI';

const MOODS = [
  { emoji: '😄', label: 'Excellent', score: 5, color: 'var(--green)' },
  { emoji: '😊', label: 'Good', score: 4, color: 'var(--teal)' },
  { emoji: '😐', label: 'Neutral', score: 3, color: 'var(--amber)' },
  { emoji: '😔', label: 'Low', score: 2, color: 'var(--pink)' },
  { emoji: '😩', label: 'Rough', score: 1, color: 'var(--red)' },
];

export default function MoodPage() {
  const [moods, setMoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [moodsRes, statsRes] = await Promise.all([api.get('/mood'), api.get('/mood/stats')]);
      setMoods(moodsRes.data);
      setStats(statsRes.data);
    } catch { toast.error('Failed to load mood data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLog = async () => {
    if (!selected) { toast.error('Select a mood first'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/mood', { ...selected, note });
      setMoods(prev => [data, ...prev]);
      setSelected(null);
      setNote('');
      toast.success('Mood logged! +5 XP 🧘');
      load(); // refresh stats
    } catch { toast.error('Failed to log mood'); }
    finally { setSaving(false); }
  };

  const avgLabel = (score) => {
    if (score >= 4.5) return { label: 'Excellent', color: 'var(--green)' };
    if (score >= 3.5) return { label: 'Good', color: 'var(--teal)' };
    if (score >= 2.5) return { label: 'Neutral', color: 'var(--amber)' };
    if (score >= 1.5) return { label: 'Low', color: 'var(--pink)' };
    return { label: 'Rough', color: 'var(--red)' };
  };

  const avg = stats?.average || 0;
  const mood = avgLabel(avg);

  return (
    <div style={{ padding: 28 }}>
      <PageHeader title="◐ Mood Log" subtitle="Track your emotional patterns over time" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Log today's mood */}
        <Card>
          <CardTitle>How are you feeling right now?</CardTitle>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <button
                key={m.score}
                onClick={() => setSelected(m)}
                style={{
                  padding: '10px 16px', borderRadius: 'var(--r2)', cursor: 'pointer',
                  background: selected?.score === m.score ? 'var(--purple-dim)' : 'var(--bg4)',
                  border: `1px solid ${selected?.score === m.score ? 'var(--purple)' : 'var(--border)'}`,
                  transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 24 }}>{m.emoji}</span>
                <span style={{ fontSize: 10, color: selected?.score === m.score ? 'var(--purple2)' : 'var(--text3)' }}>{m.label}</span>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              style={{
                width: '100%', background: 'var(--bg4)', border: '1px solid var(--border)',
                borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)',
                fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <Button onClick={handleLog} disabled={saving || !selected}>
            {saving ? <><Spinner size={12} /> Logging...</> : 'Log Mood'}
          </Button>
        </Card>

        {/* Stats + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Weekly average */}
          {stats && (
            <Card>
              <CardTitle>Weekly Average</CardTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: mood.color }}>
                  {avg.toFixed(1)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: mood.color }}>{mood.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>from {stats.count} entries this week</div>
                </div>
              </div>
              {stats.daily?.length > 0 && (
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={stats.daily}>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 5]} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [v, 'avg mood']}
                    />
                    <Line type="monotone" dataKey="avg" stroke="var(--purple)" strokeWidth={2} dot={{ fill: 'var(--purple)', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          )}

          {/* History */}
          <Card style={{ flex: 1 }}>
            <CardTitle>History</CardTitle>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
            : moods.length ? (
              moods.slice(0, 8).map((m, i) => (
                <div key={m._id || i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 0', borderBottom: i < moods.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 22 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                    {m.note && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{m.note}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {new Date(m.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState icon="💭" title="No mood entries yet" desc="Start tracking to see patterns" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
