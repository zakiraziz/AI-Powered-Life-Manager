import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { journalTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateJournalEntryBody, UpdateJournalEntryBody, UpdateJournalEntryParams, DeleteJournalEntryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/journal", async (req, res) => {
  try {
    const entries = await db.select().from(journalTable).orderBy(journalTable.createdAt);
    const mapped = entries.map(e => ({
      id: e.id,
      title: e.title ?? null,
      content: e.content,
      mood: e.mood ?? null,
      tags: JSON.parse(e.tags || "[]"),
      createdAt: e.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err, "Failed to get journal entries");
    res.status(500).json({ error: "Failed to get journal entries" });
  }
});

router.post("/journal", async (req, res) => {
  try {
    const body = CreateJournalEntryBody.parse(req.body);
    const [entry] = await db.insert(journalTable).values({
      title: body.title ?? null,
      content: body.content,
      mood: body.mood ?? null,
      tags: JSON.stringify(body.tags || []),
    }).returning();
    res.status(201).json({
      id: entry.id,
      title: entry.title ?? null,
      content: entry.content,
      mood: entry.mood ?? null,
      tags: JSON.parse(entry.tags || "[]"),
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create journal entry");
    res.status(500).json({ error: "Failed to create journal entry" });
  }
});

router.patch("/journal/:id", async (req, res) => {
  try {
    const { id } = UpdateJournalEntryParams.parse(req.params);
    const body = UpdateJournalEntryBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.mood !== undefined) updates.mood = body.mood;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);

    const [entry] = await db.update(journalTable).set(updates).where(eq(journalTable.id, id)).returning();
    if (!entry) return res.status(404).json({ error: "Journal entry not found" });
    res.json({
      id: entry.id,
      title: entry.title ?? null,
      content: entry.content,
      mood: entry.mood ?? null,
      tags: JSON.parse(entry.tags || "[]"),
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update journal entry");
    res.status(500).json({ error: "Failed to update journal entry" });
  }
});

router.delete("/journal/:id", async (req, res) => {
  try {
    const { id } = DeleteJournalEntryParams.parse(req.params);
    await db.delete(journalTable).where(eq(journalTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete journal entry");
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

export default router;
