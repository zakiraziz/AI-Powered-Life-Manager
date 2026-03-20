import React from 'react';

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        padding: '20px',
        ...style,
      }}
      className={`fade-in ${className}`}
    >
      {children}
    </div>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────
export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: 'var(--text3)',
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 'var(--r2)', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Syne', sans-serif", fontWeight: 600,
    transition: 'all var(--transition)', opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
  const sizes = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '9px 18px', fontSize: 13 }, lg: { padding: '12px 24px', fontSize: 14 } };
  const variants = {
    primary: { background: 'var(--purple)', color: '#fff' },
    ghost: { background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)' },
    danger: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red-dim)' },
    success: { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-dim)' },
    teal: { background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid var(--teal-dim)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</label>}
      <input
        style={{
          background: 'var(--bg4)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)',
          fontSize: 14, outline: 'none', width: '100%',
          transition: 'border-color var(--transition)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</label>}
      <select
        style={{
          background: 'var(--bg4)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)',
          fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────
export function Textarea({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</label>}
      <textarea
        style={{
          background: 'var(--bg4)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '9px 12px', color: 'var(--text)',
          fontSize: 14, outline: 'none', width: '100%', resize: 'vertical', minHeight: 80,
          transition: 'border-color var(--transition)', fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        {...props}
      />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ children, color = 'purple' }) {
  const colors = {
    purple: { bg: 'var(--purple-dim)', text: 'var(--purple2)' },
    green: { bg: 'var(--green-dim)', text: 'var(--green)' },
    amber: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
    red: { bg: 'var(--red-dim)', text: 'var(--red)' },
    teal: { bg: 'var(--teal-dim)', text: 'var(--teal)' },
    pink: { bg: 'var(--pink-dim)', text: 'var(--pink)' },
  };
  const c = colors[color] || colors.purple;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────
export function ProgressBar({ value = 0, color = 'purple', height = 7 }) {
  const gradients = {
    purple: 'linear-gradient(90deg, var(--purple), var(--purple2))',
    teal: 'linear-gradient(90deg, var(--teal), #5eead4)',
    amber: 'linear-gradient(90deg, var(--amber), #fbbf24)',
    green: 'linear-gradient(90deg, var(--green), #4ade80)',
    pink: 'linear-gradient(90deg, var(--pink), #fb7185)',
  };
  return (
    <div style={{ background: 'var(--bg5)', borderRadius: 100, height, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: gradients[color] || gradients.purple,
        borderRadius: 100,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: '2px solid var(--border2)',
      borderTopColor: 'var(--purple)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

// ── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      {desc && <div style={{ fontSize: 13, marginBottom: 16 }}>{desc}</div>}
      {action}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ fontSize: 26, letterSpacing: '-0.5px' }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg3)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r3)', padding: 24, width: '100%', maxWidth: width,
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'fadeIn 0.15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, lineHeight: 1 }}
            >×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'var(--text)' }) {
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '16px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}
