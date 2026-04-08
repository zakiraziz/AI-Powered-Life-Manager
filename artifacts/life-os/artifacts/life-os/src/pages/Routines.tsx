import React, { useState } from "react";
import { useGetRoutines, useCreateRoutine, useUpdateRoutine, useDeleteRoutine, getGetRoutinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Flame, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Routines() {
  const queryClient = useQueryClient();
  const { data: routines } = useGetRoutines();
  const createRoutine = useCreateRoutine({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRoutinesQueryKey() }) } });
  const updateRoutine = useUpdateRoutine({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRoutinesQueryKey() }) } });
  const deleteRoutine = useDeleteRoutine({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRoutinesQueryKey() }) } });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", emoji: "☕", frequency: "daily" as const, time: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createRoutine.mutate({ data: formData });
    setFormData({ title: "", emoji: "☕", frequency: "daily", time: "" });
    setIsAddOpen(false);
  };

  const toggleComplete = (routine: any) => {
    updateRoutine.mutate({ 
      id: routine.id, 
      data: { 
        completedToday: !routine.completedToday,
        streak: !routine.completedToday ? routine.streak + 1 : Math.max(0, routine.streak - 1)
      } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Daily Routines</h1>
          <p className="text-muted-foreground">Build habits that stick, one day at a time.</p>
        </div>
        <GradientButton onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5" /> Add Routine
        </GradientButton>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {routines?.map((routine) => (
            <motion.div key={routine.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
              <GlassCard className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6" hoverEffect={false}>
                <button
                  onClick={() => toggleComplete(routine)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 border flex-shrink-0 ${
                    routine.completedToday 
                      ? "bg-gradient-to-br from-primary to-accent border-transparent shadow-[0_0_20px_rgba(168,85,247,0.4)] text-white" 
                      : "bg-black/20 border-white/10 hover:border-white/30 text-white/50"
                  }`}
                >
                  {routine.completedToday ? <Check className="w-8 h-8" /> : routine.emoji}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-bold font-display truncate transition-colors ${routine.completedToday ? "text-white" : "text-white/90"}`}>
                    {routine.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 capitalize">
                      {routine.frequency}
                    </span>
                    {routine.time && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {routine.time}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center px-4 border-l border-white/10">
                  <Flame className={`w-6 h-6 ${routine.streak > 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" : "text-white/20"}`} />
                  <span className={`text-sm font-bold mt-1 ${routine.streak > 0 ? "text-orange-400" : "text-white/30"}`}>
                    {routine.streak}
                  </span>
                </div>

                <button 
                  onClick={() => deleteRoutine.mutate({ id: routine.id })}
                  className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Daily Routine">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="flex gap-4">
            <div className="w-20">
              <label className="block text-sm font-medium text-white/70 mb-1.5">Emoji</label>
              <input 
                type="text" required maxLength={2}
                value={formData.emoji}
                onChange={e => setFormData({...formData, emoji: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/70 mb-1.5">Routine Name</label>
              <input 
                type="text" required autoFocus
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                placeholder="e.g. Read 10 pages"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Frequency</label>
              <select 
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value as any})}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Time (Optional)</label>
              <input 
                type="time" 
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <GradientButton variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>Cancel</GradientButton>
            <GradientButton type="submit" disabled={!formData.title || createRoutine.isPending} isLoading={createRoutine.isPending}>
              Create Routine
            </GradientButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
