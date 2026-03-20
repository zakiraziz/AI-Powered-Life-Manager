import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Card, PageHeader, Button, Input, Modal, Badge, ProgressBar, EmptyState, Spinner } from '../components/UI';
import { RiAddLine, RiRocketLine, RiCheckLine, RiDeleteBinLine } from 'react-icons/ri';

const COLORS = ['purple', 'teal', 'amber', 'green', 'pink'];
const COLOR_MAP = { purple: 'var(--purple)', teal: 'var(--teal)', amber: 'var(--amber)', green: 'var(--green)', pink: 'var(--pink)' };

function StatusDot({ status }) {
  const styles = {
    done: { bg: 'var(--purple)', border: 'var(--purple)' },
    active: { bg: 'var(--teal-dim)', border: 'var(--teal)', animation: 'pulse-glow 2s infinite' },
    pending: { bg: 'var(--bg5)', border: 'var(--border2)' },
  };
  const s = styles[status] || styles.pending;
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: s.bg, border: `2px solid ${s.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, flexShrink: 0, zIndex: 1,
      boxShadow: s.animation ? '0 0 0 0 rgba(45,212,191,0.3)' : 'none',
      animation: s.animation || 'none',
    }}>
      {status === 'done' && <RiCheckLine style={{ color: '#fff' }} />}
      {status === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />}
    </div>
  );
}

function GoalCard({ goal, onMilestoneComplete, onDelete }) {
  const color = goal.color || 'purple';
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15 }}>{goal.title}</h3>
            {goal.aiGenerated && <Badge color="teal">✦ AI</Badge>}
            <Badge color={goal.status === 'completed' ? 'green' : 'purple'}>{goal.status}</Badge>
          </div>
          {goal.description && <p style={{ fontSize: 12, color: 'var(--text3)' }}>{goal.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: COLOR_MAP[color] || 'var(--purple2)', fontFamily: "'Syne', sans-serif" }}>{goal.progress}%</span>
          <button onClick={() => onDelete(goal._id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>
            <RiDeleteBinLine />
          </button>
        </div>
      </div>
      <ProgressBar value={goal.progress} color={color} height={8} />
      <div style={{ marginTop: 20 }}>
        {goal.milestones?.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < goal.milestones.length - 1 ? 16 : 0, position: 'relative' }}>
            {i < goal.milestones.length - 1 && (
              <div style={{ position: 'absolute', left: 14, top: 30, bottom: -16, width: 1, background: 'var(--border)', zIndex: 0 }} />
            )}
            <StatusDot status={m.status} />
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: m.status === 'done' ? 'var(--text3)' : 'var(--text)', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>
                {m.title}
              </div>
              {m.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m.description}</div>}
              {m.timeframe && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>⏱ {m.timeframe}</div>}
              {m.status === 'active' && (
                <Button size="sm" variant="teal" style={{ marginTop: 8 }} onClick={() => onMilestoneComplete(goal._id, i)}>
                  <RiCheckLine /> Mark done
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState('ai');

  const load = useCallback(async () => {
    try { const { data } = await api.get('/goals'); setGoals(data); }
    catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAIGenerate = async () => {
    if (!aiInput.trim()) return;
    setGenerating(true);
    try {
      const { data } = await api.post('/goals/generate', { title: aiInput });
      setGoals(prev => [data, ...prev]);
      setModalOpen(false);
      setAiInput('');
      toast.success('Roadmap created by Jarvis! +50 XP 🎯');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const handleManualCreate = async () => {
    if (!manualTitle.trim()) return;
    setGenerating(true);
    try {
      const { data } = await api.post('/goals', { title: manualTitle });
      setGoals(prev => [data, ...prev]);
      setModalOpen(false);
      setManualTitle('');
      toast.success('Goal created! +50 XP');
    } catch { toast.error('Failed to create goal'); }
    finally { setGenerating(false); }
  };

  const handleMilestoneComplete = async (goalId, mIdx) => {
    try {
      const { data } = await api.patch(`/goals/${goalId}/milestone/${mIdx}`, { status: 'done' });
      setGoals(prev => prev.map(g => g._id === goalId ? data : g));
      toast.success('Milestone complete! +100 XP 🏆');
    } catch { toast.error('Failed to update milestone'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    setGoals(prev => prev.filter(g => g._id !== id));
    try { await api.delete(`/goals/${id}`); toast.success('Goal deleted'); }
    catch { load(); }
  };

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        title="◎ Goals & Auto-Planning"
        subtitle="Set a goal — Jarvis builds your roadmap"
        action={<Button onClick={() => setModalOpen(true)}><RiAddLine /> New Goal</Button>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : goals.length ? (
        goals.map(g => (
          <GoalCard key={g._id} goal={g} onMilestoneComplete={handleMilestoneComplete} onDelete={handleDelete} />
        ))
      ) : (
        <Card>
          <EmptyState
            icon="🎯"
            title="No goals yet"
            desc="Set a goal and let Jarvis AI break it into a complete roadmap"
            action={<Button onClick={() => setModalOpen(true)}>✦ Create your first goal</Button>}
          />
        </Card>
      )}

      {/* Create Goal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Goal">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg4)', borderRadius: 'var(--r2)', padding: 3 }}>
          {[['ai', '✦ AI Auto-Plan'], ['manual', '✏️ Manual']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === v ? 'var(--bg3)' : 'none',
              color: tab === v ? 'var(--text)' : 'var(--text3)',
              fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 600,
              transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>

        {tab === 'ai' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple-dim2)', borderRadius: 'var(--r2)', padding: '10px 14px', fontSize: 13, color: 'var(--purple3)' }}>
              ✦ Jarvis will analyze your goal and create a full roadmap with milestones and timeframes.
            </div>
            <Input
              label="What's your goal?"
              placeholder='e.g. "Learn Python in 3 months" or "Run a 5K in 8 weeks"'
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
            />
            <Button onClick={handleAIGenerate} disabled={generating || !aiInput.trim()} style={{ justifyContent: 'center' }}>
              {generating ? <><Spinner size={14} /> Jarvis is planning...</> : '✦ Generate Roadmap with AI'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Goal title" placeholder="e.g. Read 24 books this year" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
            <Button onClick={handleManualCreate} disabled={generating || !manualTitle.trim()} style={{ justifyContent: 'center' }}>
              {generating ? <><Spinner size={14} /> Creating...</> : 'Create Goal'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
