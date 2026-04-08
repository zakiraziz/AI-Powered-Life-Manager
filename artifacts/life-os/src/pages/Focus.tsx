import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Play, Pause, RotateCcw, Coffee, Brain, Zap, Volume2, VolumeX, CheckCircle2, Timer
} from "lucide-react";

type Mode = "focus" | "short-break" | "long-break";

const MODES: Record<Mode, { label: string; duration: number; color: string; gradient: string; icon: React.ElementType }> = {
  focus: { label: "Focus", duration: 25 * 60, color: "#8b5cf6", gradient: "from-violet-600 to-purple-700", icon: Brain },
  "short-break": { label: "Short Break", duration: 5 * 60, color: "#10b981", gradient: "from-emerald-500 to-teal-600", icon: Coffee },
  "long-break": { label: "Long Break", duration: 15 * 60, color: "#06b6d4", gradient: "from-cyan-500 to-blue-600", icon: Zap },
};

const AMBIENT_SOUNDS = [
  { id: "none", label: "Silence", emoji: "🔇" },
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "forest", label: "Forest", emoji: "🌲" },
  { id: "ocean", label: "Ocean", emoji: "🌊" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "fire", label: "Fireplace", emoji: "🔥" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Focus() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [ambient, setAmbient] = useState("none");
  const [completedToday, setCompletedToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMode = MODES[mode];
  const progress = 1 - timeLeft / currentMode.duration;
  const circumference = 2 * Math.PI * 120;

  useEffect(() => {
    setTimeLeft(currentMode.duration);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            if (mode === "focus") {
              setSessions((s) => s + 1);
              setCompletedToday((c) => c + 1);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
  };

  const tasks = [
    "Complete the project proposal",
    "Review quarterly budget",
    "Read Atomic Habits chapters 5-8",
    "Prepare for team standup",
  ];
  const [taskChecked, setTaskChecked] = useState<boolean[]>(tasks.map(() => false));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Timer className="w-8 h-8 text-violet-400" />
          Focus Timer
        </h1>
        <p className="text-muted-foreground mt-1">Deep work sessions to maximize your flow state.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2"
        >
          <GlassCard hoverEffect={false} className="flex flex-col items-center py-10 px-8">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-10 p-1.5 rounded-xl bg-white/5 border border-white/10">
              {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === key
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Timer Ring */}
            <div className="relative mb-10">
              <svg width="280" height="280" className="-rotate-90">
                <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle
                  cx="140" cy="140" r="120"
                  fill="none"
                  stroke={currentMode.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ filter: `drop-shadow(0 0 12px ${currentMode.color}80)` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={timeLeft}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-6xl font-bold text-white font-mono tracking-tight">
                      {formatTime(timeLeft)}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm font-medium flex items-center gap-1.5">
                      <currentMode.icon className="w-4 h-4" style={{ color: currentMode.color }} />
                      {currentMode.label}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${currentMode.color}60` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRunning(!isRunning)}
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentMode.gradient} flex items-center justify-center shadow-2xl`}
                style={{ boxShadow: isRunning ? `0 0 30px ${currentMode.color}60` : undefined }}
              >
                {isRunning ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </motion.button>

              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{sessions}</p>
                  <p className="text-[10px] text-muted-foreground">done</p>
                </div>
              </div>
            </div>

            {/* Session progress dots */}
            <div className="flex gap-2 mt-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{
                    backgroundColor: i < sessions % 4 ? currentMode.color : "rgba(255,255,255,0.1)",
                    boxShadow: i < sessions % 4 ? `0 0 8px ${currentMode.color}` : undefined,
                  }}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">until long break</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Side Panel */}
        <div className="space-y-5">
          {/* Today's Stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard className="p-5">
              <h3 className="text-white font-semibold mb-4 text-sm">Today's Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sessions completed</span>
                  <span className="text-white font-bold">{completedToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Focus time</span>
                  <span className="text-white font-bold">{completedToday * 25}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Breaks taken</span>
                  <span className="text-white font-bold">{Math.floor(completedToday / 2)}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Ambient Sound */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-5">
              <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-violet-400" />
                Ambient Sound
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setAmbient(sound.id)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      ambient === sound.id
                        ? "bg-violet-500/30 border border-violet-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xl mb-1">{sound.emoji}</div>
                    <p className="text-[10px] text-muted-foreground">{sound.label}</p>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Quick Tasks */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard className="p-5">
              <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Focus Tasks
              </h3>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const next = [...taskChecked];
                      next[i] = !next[i];
                      setTaskChecked(next);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      taskChecked[i] ? "opacity-50" : "hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                      taskChecked[i] ? "bg-emerald-500 border-emerald-500" : "border-white/30"
                    }`}>
                      {taskChecked[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs ${taskChecked[i] ? "line-through text-muted-foreground" : "text-white/80"}`}>
                      {task}
                    </span>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
