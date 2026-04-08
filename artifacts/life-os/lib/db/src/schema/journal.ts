import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalTable = pgTable("journal", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  mood: text("mood"),
  tags: text("tags").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJournalSchema = createInsertSchema(journalTable).omit({ id: true, createdAt: true });
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type Journal = typeof journalTable.$inferSelect;
