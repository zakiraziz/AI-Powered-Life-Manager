import React, { useState } from "react";
import { useGetJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, getGetJournalEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Trash2, PenLine, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const MOODS = [
  { id: 'great', emoji: '🤩', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'good', emoji: '🙂', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'okay', emoji: '😐', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'bad', emoji: '😔', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'awful', emoji: '😫', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
] as const;

export default function Journal() {
  const queryClient = useQueryClient();
  const { data: entries } = useGetJournalEntries();
  const createEntry = useCreateJournalEntry({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() }) } });
  const deleteEntry = useDeleteJournalEntry({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() }) } });

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<any>('good');
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    createEntry.mutate({ data: { content, mood, tags } });
    setContent("");
    setTags([]);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">Journal</h1>
        <p className="text-muted-foreground">Capture your thoughts, reflections, and mood.</p>
      </div>

      <GlassCard className="mb-10 p-1 border-white/20">
        <form onSubmit={handleCreate} className="p-5">
          <div className="flex gap-4 mb-4 overflow-x-auto hide-scrollbar pb-2">
            {MOODS.map(m => (
              <button
                key={m.id} type="button"
                onClick={() => setMood(m.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  mood === m.id ? m.color : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="font-medium capitalize">{m.id}</span>
              </button>
            ))}
          </div>

          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-transparent border-none text-white text-lg resize-none focus:outline-none focus:ring-0 placeholder:text-white/20 min-h-[120px] mb-4"
            placeholder="What's on your mind today?"
            autoFocus
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Tag className="w-4 h-4 text-white/30" />
              {tags.map(tag => (
                <span key={tag} className="bg-primary/20 text-primary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-primary/30">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">&times;</button>
                </span>
              ))}
              <input 
                type="text" 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags..."
                className="bg-transparent text-sm text-white focus:outline-none placeholder:text-white/30 w-24"
              />
            </div>
            <GradientButton type="submit" disabled={!content || createEntry.isPending} isLoading={createEntry.isPending} className="w-full sm:w-auto px-8">
              <PenLine className="w-4 h-4" /> Save Entry
            </GradientButton>
          </div>
        </form>
      </GlassCard>

      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold text-white mb-4">Past Entries</h2>
        <AnimatePresence>
          {entries?.map(entry => {
            const moodData = MOODS.find(m => m.id === entry.mood);
            return (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <GlassCard className="relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {moodData && (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${moodData.color}`}>
                          {moodData.emoji}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{format(new Date(entry.createdAt), "EEEE, MMMM do, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(entry.createdAt), "h:mm a")}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteEntry.mutate({ id: entry.id })}
                      className="opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                      {entry.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded bg-white/5 text-white/50 border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
