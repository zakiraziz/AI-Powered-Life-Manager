import React, { useState } from "react";
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask, getGetTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Modal } from "@/components/ui/Modal";
import { Plus, Check, Trash2, Calendar, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Tasks() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useGetTasks();
  const createTask = useCreateTask({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }) } });
  const updateTask = useUpdateTask({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }) } });
  const deleteTask = useDeleteTask({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() }) } });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", priority: "medium" as const, category: "" });

  const pendingTasks = tasks?.filter(t => !t.completed) || [];
  const completedTasks = tasks?.filter(t => t.completed) || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    createTask.mutate({ data: formData });
    setFormData({ title: "", description: "", priority: "medium", category: "" });
    setIsAddOpen(false);
  };

  const handleToggle = (task: any) => {
    updateTask.mutate({ id: task.id, data: { completed: !task.completed } });
  };

  const TaskItem = ({ task }: { task: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
        task.completed 
          ? "bg-white/5 border-white/5 opacity-50" 
          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
      }`}
    >
      <div className="flex gap-4 items-start">
        <button 
          onClick={() => handleToggle(task)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed 
              ? "bg-primary border-primary text-white" 
              : "border-white/30 hover:border-primary text-transparent"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1">
          <h3 className={`text-lg font-medium text-white transition-all ${task.completed ? "line-through text-white/50" : ""}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              task.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {task.priority.toUpperCase()}
            </span>
            {task.category && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {task.category}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => deleteTask.mutate({ id: task.id })}
          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Tasks</h1>
          <p className="text-muted-foreground">Focus on what matters most today.</p>
        </div>
        <GradientButton onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5" /> Add Task
        </GradientButton>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Pending</h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pendingTasks.length > 0 ? pendingTasks.map(t => <TaskItem key={t.id} task={t} />) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                  No pending tasks. You're all caught up!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {completedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4">Completed</h2>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {completedTasks.map(t => <TaskItem key={t.id} task={t} />)}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Task">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Task Title</label>
            <input 
              autoFocus
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]"
              placeholder="Add details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as any})}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Category</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                placeholder="e.g. Work, Health"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <GradientButton variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>Cancel</GradientButton>
            <GradientButton type="submit" disabled={!formData.title || createTask.isPending} isLoading={createTask.isPending}>
              Create Task
            </GradientButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
