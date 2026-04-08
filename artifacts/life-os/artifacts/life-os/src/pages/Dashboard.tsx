import React from "react";
import { format } from "date-fns";
import { useGetStats, useGetTasks, useGetRoutines } from "@workspace/api-client-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatTimeGreeting } from "@/lib/utils";
import { CheckCircle2, Target, Flame, BookText, Calendar, SquareCheck, Repeat } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: tasks } = useGetTasks();
  const { data: routines } = useGetRoutines();

  const today = new Date();
  const pendingTasks = tasks?.filter(t => !t.completed).slice(0, 4) || [];
  const todayRoutines = routines?.filter(r => r.frequency === 'daily' || r.frequency === 'weekdays').slice(0, 4) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-8 md:p-12 shadow-2xl border border-white/10"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-80 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium mb-6 text-white/90">
              <Calendar className="w-4 h-4 text-primary" />
              {format(today, "EEEE, MMMM do")}
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-2">
              {formatTimeGreeting()}, <span className="text-gradient">Creator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Ready to orchestrate another beautiful day? Here's what needs your attention.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tasks Done", value: stats?.tasksCompleted || 0, total: stats?.tasksTotal || 0, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Active Goals", value: stats?.goalsInProgress || 0, icon: Target, color: "text-blue-400" },
          { label: "Routine Streak", value: stats?.routinesStreak || 0, icon: Flame, color: "text-orange-400", suffix: "days" },
          { label: "Journal Entries", value: stats?.journalEntries || 0, icon: BookText, color: "text-purple-400" }
        ].map((stat, i) => (
          <GlassCard key={i} hoverEffect={true} className="flex flex-col justify-between" transition={{ delay: i * 0.1 }}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-white">
                {statsLoading ? "-" : stat.value}
                {stat.total ? <span className="text-lg text-muted-foreground">/{stat.total}</span> : null}
                {stat.suffix && <span className="text-lg text-muted-foreground ml-1">{stat.suffix}</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Tasks */}
        <GlassCard hoverEffect={false} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <SquareCheck className="w-5 h-5 text-primary" /> Upcoming Tasks
            </h2>
          </div>
          <div className="space-y-3 flex-1">
            {pendingTasks.length > 0 ? pendingTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${
                  task.priority === 'high' ? 'bg-red-500 text-red-500' : 
                  task.priority === 'medium' ? 'bg-orange-500 text-orange-500' : 'bg-blue-500 text-blue-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  {task.category && <p className="text-xs text-muted-foreground">{task.category}</p>}
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p>All caught up!</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Today's Routines */}
        <GlassCard hoverEffect={false} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-accent" /> Today's Routines
            </h2>
          </div>
          <div className="space-y-3 flex-1">
            {todayRoutines.length > 0 ? todayRoutines.map((routine) => (
              <div key={routine.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">
                  {routine.emoji || '✨'}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{routine.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" /> {routine.streak} streak
                  </p>
                </div>
                {routine.completedToday ? (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white/20" />
                )}
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <Repeat className="w-12 h-12 mb-2 opacity-20" />
                <p>No routines scheduled for today.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
