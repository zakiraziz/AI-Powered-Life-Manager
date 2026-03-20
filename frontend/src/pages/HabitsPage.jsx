import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Card, PageHeader, Button, Input, Select, Modal, Badge, EmptyState, Spinner } from '../components/UI';
import { RiAddLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

const EMOJIS = ['💪', '📖', '🧘', '🥗', '💧', '🏃', '✍️', '😴', '🎵', '🌿', '💊', '🚴'];
const CATEGORIES = ['Health', 'Learning', 'Mindfulness', 'Fitness', 'Nutrition', 'Sleep', 'Work', 'Social'];

function HabitCard({ habit, onComplete, onUndo }) {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekData = habit.weekData || [];

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 26 }}>{habit.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{habit.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{habit.category}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {habit.streak > 0 && (
            <Badge color="amber">🔥 {habit.streak}</Badge>
          )}
          {habit.completedToday ? (
            <Button size="sm" variant="success" onClick={() => onUndo(habit._id)}>
              <RiCheckLine /> Done
            </Button>
          ) : (
            <Button size="sm" onClick={() => onComplete(habit._id)}>
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* 7-day grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {weekData.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: d.done ? 'var(--purple)' : 'var(--bg5)',
              border: i === 6 ? `2px solid ${d.done ? 'var(--purple)' : 'var(--border2)'}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: d.done ? '#fff' : 'transparent',
            }}>
              {d.done && '✓'}
            </div>
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>{weekDays[i]}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {weekData.filter(d => d.done).length}/7 this week
        </div>
      </div>
    </Card>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '💪', category: 'Health', frequency: 'daily' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get('/habits'); setHabits(data); }
    catch { toast.error('Failed to load habits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id) => {
    try {
      const { data } = await api.post(`/habits/${id}/complete`);
      setHabits(prev => prev.map(h => h._id === id ? data : h));
      toast.success(`+${data.xpReward || 15} XP! Habit logged 💪`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Already done today');
    }
  };

  const handleUndo = async (id) => {
    try {
      const { data } = await api.delete(`/habits/${id}/complete`);
      setHabits(prev => prev.map(h => h._id === id ? data : h));
      toast.success('Habit unmarked');
    } catch { toast.error('Failed to undo'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/habits', form);
      setHabits(prev => [...prev, { ...data, weekData: Array(7).fill({ done: false }), completedToday: false }]);
      setModalOpen(false);
      setForm({ name: '', emoji: '💪', category: 'Health', frequency: 'daily' });
      toast.success('Habit added! +25 XP');
    } catch { toast.error('Failed to create habit'); }
    finally { setSaving(false); }
  };

  const totalDoneToday = habits.filter(h => h.completedToday).length;

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        title="◉ Habits"
        subtitle={`${totalDoneToday}/${habits.length} completed today`}
        action={<Button onClick={() => setModalOpen(true)}><RiAddLine /> Add Habit</Button>}
      />

      {/* Today's summary */}
      {habits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--purple2)' }}>{totalDoneToday}/{habits.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Done Today</div>
          </div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--amber)' }}>
              🔥 {Math.max(...habits.map(h => h.streak || 0), 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Best Streak</div>
          </div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--green)' }}>
              {habits.length > 0 ? Math.round(habits.reduce((s, h) => s + ((h.weekData || []).filter(d => d.done).length / 7) * 100, 0) / habits.length) : 0}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Weekly Rate</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : habits.length ? (
        habits.map(h => <HabitCard key={h._id} habit={h} onComplete={handleComplete} onUndo={handleUndo} />)
      ) : (
        <Card>
          <EmptyState
            icon="⚡"
            title="No habits yet"
            desc="Start tracking daily habits to build streaks and earn XP"
            action={<Button onClick={() => setModalOpen(true)}>+ Add your first habit</Button>}
          />
        </Card>
      )}

      {/* Add Habit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Habit">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Habit name" placeholder="e.g. Morning workout, Read 30 min" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />

          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EMOJIS.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => setForm(p => ({ ...p, emoji: e }))}
                  style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 18,
                    background: form.emoji === e ? 'var(--purple-dim)' : 'var(--bg4)',
                    border: `1px solid ${form.emoji === e ? 'var(--purple)' : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Frequency" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button type="submit" disabled={saving}>{saving ? <><Spinner size={12} /> Adding...</> : 'Add Habit'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
