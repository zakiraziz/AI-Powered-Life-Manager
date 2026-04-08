import React from "react";
import { motion } from "framer-motion";
import { useGetStats, useGetTasks, useGetRoutines, useGetGoals } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart, Line
} from "recharts";
import { TrendingUp, CheckCircle2, Target, Flame, BookText, Zap } from "lucide-react";

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateWeeklyData(total: number) {
  return weekDays.map((day) => ({
    day,
    completed: Math.floor(Math.random() * Math.max(total, 1)),
    total: Math.max(total, 1),
  }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-white font-semibold text-sm mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { data: stats } = useGetStats();
  const { data: tasks } = useGetTasks();
  const { data: routines } = useGetRoutines();
  const { data: goals } = useGetGoals();

  const taskCompletionRate = stats ? Math.round((stats.tasksCompleted / Math.max(stats.tasksTotal, 1)) * 100) : 0;
  const routineCompletionRate = stats ? Math.round((stats.routinesCompletedToday / Math.max(stats.routinesTotal, 1)) * 100) : 0;

  const weeklyTaskData = generateWeeklyData(stats?.tasksTotal || 5);

  const priorityData = tasks ? [
    { name: "High", value: tasks.filter(t => t.priority === "high").length, color: "#ef4444" },
    { name: "Medium", value: tasks.filter(t => t.priority === "medium").length, color: "#f59e0b" },
    { name: "Low", value: tasks.filter(t => t.priority === "low").length, color: "#22c55e" },
  ].filter(d => d.value > 0) : [];

  const goalProgressData = goals?.map(g => ({
    name: g.emoji ? `${g.emoji} ${g.title}` : g.title,
    progress: g.progress,
    fill: COLORS[goals.indexOf(g) % COLORS.length],
  })) || [];

  const radialData = [
    { name: "Tasks", value: taskCompletionRate, fill: "#8b5cf6" },
    { name: "Routines", value: routineCompletionRate, fill: "#ec4899" },
  ];

  const trendData = weekDays.map((day, i) => ({
    day,
    productivity: Math.floor(Math.random() * 40) + 60,
    mood: Math.floor(Math.random() * 30) + 65,
  }));

  const statCards = [
    { label: "Completion Rate", value: `${taskCompletionRate}%`, icon: CheckCircle2, color: "text-violet-400", bg: "from-violet-500/20 to-violet-600/5", trend: "+12% vs last week" },
    { label: "Active Goals", value: stats?.goalsInProgress ?? 0, icon: Target, color: "text-pink-400", bg: "from-pink-500/20 to-pink-600/5", trend: `${goals?.length ?? 0} total` },
    { label: "Best Streak", value: `${stats?.routinesStreak ?? 0}d`, icon: Flame, color: "text-orange-400", bg: "from-orange-500/20 to-orange-600/5", trend: "Keep it up!" },
    { label: "Journal Entries", value: stats?.journalEntries ?? 0, icon: BookText, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/5", trend: "This month" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-violet-400" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Your productivity insights at a glance.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <GlassCard className="p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              <p className="text-xs text-violet-400 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />{card.trend}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Tasks Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <GlassCard hoverEffect={false}>
            <h3 className="text-white font-bold text-lg mb-6">Weekly Task Activity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyTaskData} barGap={4}>
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.05)" }} />
                <Bar dataKey="completed" name="Completed" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#374151" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Task Priority Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <GlassCard hoverEffect={false}>
            <h3 className="text-white font-bold text-lg mb-6">Task Priority Breakdown</h3>
            {priorityData.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {priorityData.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-muted-foreground">{d.name}</span>
                      <span className="ml-auto text-white font-semibold text-sm">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Add tasks to see priority breakdown</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Progress Radial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
          <GlassCard hoverEffect={false}>
            <h3 className="text-white font-bold text-lg mb-6">Goal Progress</h3>
            {goalProgressData.length > 0 ? (
              <div className="space-y-4">
                {goalProgressData.slice(0, 4).map((goal, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-white truncate max-w-[200px]">{goal.name}</span>
                      <span className="text-sm font-semibold" style={{ color: goal.fill }}>{goal.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: goal.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Add goals to see progress</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Productivity Trend Line */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <GlassCard hoverEffect={false}>
            <h3 className="text-white font-bold text-lg mb-6">Weekly Productivity Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} domain={[40, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="productivity" name="Productivity" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#8b5cf6" }} />
                <Line type="monotone" dataKey="mood" name="Mood" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#ec4899" }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-violet-500" />
                <span className="text-xs text-muted-foreground">Productivity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-pink-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #ec4899 0, #ec4899 5px, transparent 5px, transparent 8px)" }} />
                <span className="text-xs text-muted-foreground">Mood</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Completion Rings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
        <GlassCard hoverEffect={false}>
          <h3 className="text-white font-bold text-lg mb-6">Today's Completion Rings</h3>
          <div className="flex items-center justify-around">
            {[
              { label: "Tasks", value: taskCompletionRate, color: "#8b5cf6", bg: "#8b5cf620" },
              { label: "Routines", value: routineCompletionRate, color: "#ec4899", bg: "#ec489920" },
              { label: "Goals", value: goals ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / Math.max(goals.length, 1)) : 0, color: "#06b6d4", bg: "#06b6d420" },
            ].map((ring) => (
              <div key={ring.label} className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke={ring.bg} strokeWidth="10" />
                    <motion.circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - ring.value / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      style={{ filter: `drop-shadow(0 0 8px ${ring.color}60)` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{ring.value}%</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground font-medium">{ring.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
