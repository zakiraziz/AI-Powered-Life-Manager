import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Spinner, PageHeader } from '../components/UI';

const QUICK_PROMPTS = [
  { label: '📅 Plan my day', text: 'Plan my optimal day for today based on my tasks and goals' },
  { label: '🎯 Review goals', text: 'Review my active goals and tell me where I should focus' },
  { label: '⚡ Productivity tip', text: 'Give me a specific productivity tip based on my current habits' },
  { label: '🔥 Motivate me', text: 'I need motivation right now — give me a powerful pep talk' },
  { label: '📊 Weekly analysis', text: 'Analyze my productivity this week and give me 3 improvements' },
  { label: '🐍 Study plan', text: 'Create a daily study plan for Python for the next 2 weeks' },
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--bg5)' : 'var(--purple-dim)',
        color: isUser ? 'var(--text2)' : 'var(--purple2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
      }}>
        {isUser ? msg.name?.[0]?.toUpperCase() || 'U' : 'J'}
      </div>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
        fontSize: 14, lineHeight: 1.6,
        background: isUser ? 'var(--purple-dim2)' : 'var(--bg4)',
        border: `1px solid ${isUser ? 'var(--purple-dim2)' : 'var(--border)'}`,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--purple-dim)', color: 'var(--purple2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
      }}>J</div>
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'var(--bg4)', border: '1px solid var(--border)',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--text3)',
            animation: `bounce-dot 0.8s ${i * 0.15}s infinite ease`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function JarvisPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${user?.name?.split(' ')[0] || 'there'}! I'm Jarvis — your personal AI life assistant. I have full context on your tasks, goals, habits, and mood. What shall we tackle today? 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyPlan, setDailyPlan] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg, name: user?.name };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-12).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a brief connection issue. But you've got this! Check your tasks and keep moving forward. 💪"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const generateDailyPlan = async () => {
    setPlanLoading(true);
    try {
      const { data } = await api.post('/ai/daily-plan');
      setDailyPlan(data.plan);
    } catch {
      setDailyPlan("Couldn't generate plan right now. Try asking Jarvis directly!");
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div style={{ padding: 28, display: 'flex', gap: 16, height: 'calc(100vh - 40px)', maxHeight: 900 }}>
      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader title="✦ Jarvis AI" subtitle="Your personal life intelligence assistant" />

        {/* Quick prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {QUICK_PROMPTS.map(q => (
            <button
              key={q.text}
              onClick={() => sendMessage(q.text)}
              disabled={loading}
              style={{
                padding: '5px 11px', borderRadius: 100,
                border: '1px solid var(--border2)', background: 'none',
                color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--bg3)'; e.target.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--text2)'; }}
            >
              {q.label}
            </button>
          ))}
        </div>

        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Jarvis anything..."
              rows={1}
              style={{
                flex: 1, background: 'var(--bg4)', border: '1px solid var(--border)',
                borderRadius: 'var(--r2)', padding: '10px 14px', color: 'var(--text)',
                fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit',
                minHeight: 42, maxHeight: 120,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              {loading ? <Spinner size={14} /> : 'Send ↗'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Daily Plan panel */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Daily Plan</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>AI-generated plan for today</p>
        </div>
        <Card style={{ height: 'calc(100% - 60px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!dailyPlan ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>📅</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Generate your personalized daily plan</div>
              <Button onClick={generateDailyPlan} disabled={planLoading}>
                {planLoading ? <><Spinner size={12} /> Generating...</> : '✦ Generate Plan'}
              </Button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', fontSize: 13, lineHeight: 1.7, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
                {dailyPlan}
              </div>
              <Button variant="ghost" size="sm" onClick={generateDailyPlan} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                {planLoading ? <><Spinner size={12} /> Regenerating...</> : '↺ Regenerate'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
