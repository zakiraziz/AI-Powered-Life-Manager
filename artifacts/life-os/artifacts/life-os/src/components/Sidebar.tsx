import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, SquareCheck, Target, Repeat, BookOpen, BarChart3, Timer, LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: SquareCheck },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/routines", label: "Routines", icon: Repeat },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const avatarUrl = user?.profileImageUrl;
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.email?.split("@")[0] ?? "User");
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/10 bg-background/50 backdrop-blur-2xl z-40">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">LifeOS</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                  isActive ? "text-white font-medium" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/10 rounded-xl border border-violet-500/20"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-200 group-hover:scale-110",
                    isActive && "text-violet-400"
                  )}
                />
                <span className="relative z-10 text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/30" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-full gap-1 relative",
                isActive ? "text-white" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive && "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                )}
              />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
