import React, { useState } from "react";
import { useGetGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, getGetGoalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Target, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Goals() {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useGetGoals();
  const createGoal = useCreateGoal({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() }) } });
  const updateGoal = useUpdateGoal({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() }) } });
  const deleteGoal = useDeleteGoal({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGoalsQueryKey() }) } });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", targetDate: "", emoji: "🎯", color: "#a855f7" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createGoal.mutate({ data: formData });
    setFormData({ title: "", description: "", targetDate: "", emoji: "🎯", color: "#a855f7" });
    setIsAddOpen(false);
  };

  const handleProgress = (goalId: number, current: number, change: number) => {
    const newProgress = Math.max(0, Math.min(100, current + change));
    updateGoal.mutate({ id: goalId, data: { progress: newProgress } });
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Goals</h1>
          <p className="text-muted-foreground">Track your big picture aspirations.</p>
        </div>
        <GradientButton onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5" /> New Goal
        </GradientButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {goals?.map(goal => (
            <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <GlassCard className="h-full flex flex-col group relative overflow-hidden">
                <button 
                  onClick={() => deleteGoal.mutate({ id: goal.id })}
                  className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 bg-black/20 hover:bg-red-500/20 rounded-full transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10" style={{ backgroundColor: `${goal.color}20` || 'rgba(168,85,247,0.2)' }}>
                    {goal.emoji}
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="text-xl font-display font-bold text-white leading-tight">{goal.title}</h3>
                    {goal.targetDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(new Date(goal.targetDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-6 flex-1">{goal.description}</p>

                <div className="mt-auto">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-white/80">Progress</span>
                    <span className="text-white">{goal.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-4 border border-white/5 p-0.5">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <div className="absolute inset-0 bg-white/20" style={{ filter: 'blur(2px)' }}></div>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between gap-2">
                    <button onClick={() => handleProgress(goal.id, goal.progress, -10)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors border border-white/5">
                      -10%
                    </button>
                    <button onClick={() => handleProgress(goal.id, goal.progress, 10)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors border border-white/5">
                      +10%
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Set a New Goal">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Goal Title</label>
            <input 
              autoFocus required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Target Date</label>
              <input 
                type="date" 
                value={formData.targetDate}
                onChange={e => setFormData({...formData, targetDate: e.target.value})}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Emoji</label>
              <input 
                type="text" 
                maxLength={2}
                value={formData.emoji}
                onChange={e => setFormData({...formData, emoji: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <GradientButton variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>Cancel</GradientButton>
            <GradientButton type="submit" disabled={!formData.title || createGoal.isPending} isLoading={createGoal.isPending}>
              Create Goal
            </GradientButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
