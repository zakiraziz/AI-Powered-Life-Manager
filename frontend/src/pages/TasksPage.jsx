import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Card, PageHeader, Button, Input, Select, Badge, Modal, EmptyState, Spinner } from '../components/UI';
import { RiDeleteBinLine, RiCheckLine, RiAddLine, RiFilterLine } from 'react-icons/ri';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_COLOR = { high: 'red', medium: 'amber', low: 'green' };
const CATEGORIES = ['Work', 'Study', 'Health', 'Finance', 'Personal', 'General'];

function TaskRow({ task, onToggle, onDelete }) {
  const done = task.status === 'done';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: '1px solid var(--border)',
      transition: 'opacity 0.2s',
    }}>
      <button
        onClick={() => onToggle(task)}
        style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          background: done ? 'var(--purple)' : 'transparent',
          border: `2px solid ${done ? 'var(--purple)' : 'var(--border2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {done && <RiCheckLine />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text3)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{task.category}</div>
      </div>
      <Badge color={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
      {task.dueDate && (
        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
      )}
      <button onClick={() => onDelete(task._id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>
        <RiDeleteBinLine />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', priority: 'medium', category: 'General', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'todo') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  const handleToggle = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${task._id}`, { status: newStatus });
      if (newStatus === 'done') toast.success(`+${task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10} XP earned! 🎉`);
    } catch { load(); }
  };

  const handleDelete = async (id) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    try { await api.delete(`/tasks/${id}`); toast.success('Task deleted'); }
    catch { load(); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/tasks', form);
      setTasks(prev => [data, ...prev]);
      setModalOpen(false);
      setForm({ title: '', priority: 'medium', category: 'General', description: '', dueDate: '' });
      toast.success('Task added! +5 XP');
    } catch { toast.error('Failed to create task'); }
    finally { setSaving(false); }
  };

  const donePct = tasks.length ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0;

  return (
    <div style={{ padding: 28 }}>
      <PageHeader
        title="▣ Tasks"
        subtitle={`${tasks.filter(t => t.status !== 'done').length} remaining · ${donePct}% complete overall`}
        action={<Button onClick={() => setModalOpen(true)}><RiAddLine /> New Task</Button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['todo', 'To Do'], ['done', 'Done'], ['high', '🔴 High Priority']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${filter === v ? 'var(--purple)' : 'var(--border)'}`,
              background: filter === v ? 'var(--purple-dim)' : 'none',
              color: filter === v ? 'var(--purple2)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >{l}</button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : filteredTasks.length ? (
          filteredTasks.map(t => (
            <TaskRow key={t._id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
          ))
        ) : (
          <EmptyState
            icon="✅"
            title={filter === 'done' ? 'No completed tasks yet' : 'No tasks here'}
            desc="Add a new task to get started"
            action={<Button size="sm" onClick={() => setModalOpen(true)}>+ Add Task</Button>}
          />
        )}
      </Card>

      {/* Add Task Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Task title *" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          <Input label="Description" placeholder="Optional details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
            <Select label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <Input label="Due date (optional)" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button type="submit" disabled={saving}>{saving ? <><Spinner size={12} /> Adding...</> : 'Add Task'}</Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
