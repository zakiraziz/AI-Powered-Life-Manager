import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RiDashboardLine, RiRocketLine, RiTaskLine, RiFlag2Line,
  RiFireLine, RiHeartPulseLine, RiTrophyLine, RiLogoutBoxLine,
  RiMenuLine, RiCloseLine,
} from 'react-icons/ri';
import styles from './Layout.module.css';

const NAV = [
  { to: '/', icon: RiDashboardLine, label: 'Dashboard', exact: true },
  { to: '/jarvis', icon: RiRocketLine, label: 'Jarvis AI' },
  { divider: 'Work' },
  { to: '/tasks', icon: RiTaskLine, label: 'Tasks' },
  { to: '/goals', icon: RiFlag2Line, label: 'Goals & Plans' },
  { divider: 'Lifestyle' },
  { to: '/habits', icon: RiFireLine, label: 'Habits' },
  { to: '/mood', icon: RiHeartPulseLine, label: 'Mood Log' },
  { divider: 'Progress' },
  { to: '/achievements', icon: RiTrophyLine, label: 'Achievements' },
];

function XPBar({ user }) {
  const xpInLevel = (user?.xp || 0) % 500;
  const pct = Math.round((xpInLevel / 500) * 100);
  return (
    <div className={styles.xpWrap}>
      <div className={styles.xpTop}>
        <span className={styles.xpLabel}>Level {user?.level || 1}</span>
        <span className={styles.xpVal}>{user?.xp || 0} XP</span>
      </div>
      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.xpSub}>{500 - xpInLevel} XP to level {(user?.level || 1) + 1}</div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarContent = (
    <>
      <div className={styles.brand}>
        Nex<span>OS</span>
        <span className={styles.brandSub}>AI</span>
      </div>

      {user && (
        <div className={styles.userCard}>
          <div className={styles.avatar}>{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userStreak}>🔥 {user.streak || 0} day streak</div>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.divider) return (
            <div key={i} className={styles.navSection}>{item.divider}</div>
          );
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className={styles.navIcon} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.sidebarBottom}>
        <XPBar user={user} />
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <RiLogoutBoxLine /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.app}>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>{sidebarContent}</aside>

      {/* Mobile sidebar */}
      <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
        <RiMenuLine />
      </button>
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <aside className={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
              <RiCloseLine />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
