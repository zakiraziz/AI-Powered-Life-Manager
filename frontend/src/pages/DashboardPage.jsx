import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Card, CardTitle, StatCard, Badge, ProgressBar, Button, Spinner, EmptyState } from '../components/UI';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function priorityColor(p) {
  return { high: 'red', medium: 'amber', low: 'green' }[p] || 'purple';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spinner size={32} />
    </div>
  );

  const stats = data?.stats || {};
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.5px' }}>
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {today} · {stats.tasksDoneToday}/{stats.totalTasksToday} tasks done
          </p>
        </div>
        <Button onClick={() => navigate('/jarvis')} variant="ghost">
          ✦ Ask Jarvis
        </Button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Tasks Today" value={`${stats.tasksDoneToday}/${stats.totalTasksToday}`} sub={`${stats.totalTasksToday ? Math.round(stats.tasksDoneToday/stats.totalTasksToday*100) : 0}% complete`} color="var(--text)" />
        <StatCard label="Streak" value={`🔥 ${stats.streak || 0}`} sub="days in a row" color="var(--amber)" />
        <StatCard label="Total XP" value={stats.xp || 0} sub={`Level ${stats.level || 1}`} color="var(--purple2)" />
        <StatCard label="Active Goals" value={data?.goals?.length || 0} sub="in progress" color="var(--teal)" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Today's Tasks */}
        <Card>
          <CardTitle>Today's Tasks</CardTitle>
          {data?.todayTasks?.length ? data.todayTasks.slice(0, 6).map(t => (
            <div key={t._id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: t.status === 'done' ? 'var(--purple)' : 'transparent',
                border: `2px solid ${t.status === 'done' ? 'var(--purple)' : 'var(--border2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff',
              }}>
                {t.status === 'done' ? '✓' : ''}
              </div>
              <span style={{
                flex: 1, fontSize: 13,
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
                color: t.status === 'done' ? 'var(--text3)' : 'var(--text)',
              }}>{t.title}</span>
              <Badge color={priorityColor(t.priority)}>{t.priority}</Badge>
            </div>
          )) : <EmptyState icon="✅" title="All done!" desc="No tasks for today" />}
          <button
            onClick={() => navigate('/tasks')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginTop: 12, padding: '7px 12px', background: 'none', border: '1px dashed var(--border2)', borderRadius: 'var(--r2)', color: 'var(--text3)', fontSize: 13, cursor: 'pointer' }}
          >+ View all tasks →</button>
        </Card>

        {/* Goals */}
        <Card>
          <CardTitle>Active Goals</CardTitle>
          {data?.goals?.length ? data.goals.map((g, i) => (
            <div key={g._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{g.title}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>{g.progress}%</span>
              </div>
              <ProgressBar value={g.progress} color={['purple','teal','amber','green','pink'][i % 5]} />
            </div>
          )) : <EmptyState icon="🎯" title="No goals yet" action={<Button size="sm" onClick={() => navigate('/goals')}>Create a goal</Button>} />}
        </Card>

        {/* Habits This Week */}
        <Card>
          <CardTitle>Habits This Week</CardTitle>
          {data?.habits?.length ? data.habits.slice(0, 5).map(h => (
            <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18, width: 24 }}>{h.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{h.name}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {(h.weekData || []).map((d, i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: d.done ? 'var(--purple)' : 'var(--bg5)',
                  }} title={d.date?.toLocaleDateString?.()} />
                ))}
              </div>
            </div>
          )) : <EmptyState icon="⚡" title="No habits tracked" action={<Button size="sm" onClick={() => navigate('/habits')}>Add habits</Button>} />}
        </Card>

        {/* Weekly XP Chart */}
        <Card>
          <CardTitle>Weekly XP Earned</CardTitle>
          {data?.weeklyXP?.length ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.weeklyXP} barSize={24}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v} XP`, 'XP']}
                    labelStyle={{ color: 'var(--text2)' }}
                    cursor={{ fill: 'var(--bg5)' }}
                  />
                  <Bar dataKey="xp" fill="var(--purple)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                Total this week: <span style={{ color: 'var(--purple2)', fontWeight: 600 }}>
                  {data.weeklyXP.reduce((s, d) => s + d.xp, 0)} XP
                </span>
              </div>
            </>
          ) : <EmptyState icon="📊" title="No activity yet" desc="Complete tasks to earn XP" />}
        </Card>
      </div>
    </div>
  );
}
