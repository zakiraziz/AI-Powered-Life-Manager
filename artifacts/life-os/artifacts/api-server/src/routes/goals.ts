import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateGoalBody, UpdateGoalBody, UpdateGoalParams, DeleteGoalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/goals", async (req, res) => {
  try {
    const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
    const mapped = goals.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description ?? null,
      progress: g.progress,
      targetDate: g.targetDate ?? null,
      category: g.category ?? null,
      color: g.color ?? null,
      emoji: g.emoji ?? null,
      createdAt: g.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err, "Failed to get goals");
    res.status(500).json({ error: "Failed to get goals" });
  }
});

router.post("/goals", async (req, res) => {
  try {
    const body = CreateGoalBody.parse(req.body);
    const [goal] = await db.insert(goalsTable).values({
      title: body.title,
      description: body.description ?? null,
      targetDate: body.targetDate ?? null,
      category: body.category ?? null,
      color: body.color ?? null,
      emoji: body.emoji ?? null,
    }).returning();
    res.status(201).json({
      id: goal.id,
      title: goal.title,
      description: goal.description ?? null,
      progress: goal.progress,
      targetDate: goal.targetDate ?? null,
      category: goal.category ?? null,
      color: goal.color ?? null,
      emoji: goal.emoji ?? null,
      createdAt: goal.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create goal");
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/goals/:id", async (req, res) => {
  try {
    const { id } = UpdateGoalParams.parse(req.params);
    const body = UpdateGoalBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.progress !== undefined) updates.progress = body.progress;
    if (body.targetDate !== undefined) updates.targetDate = body.targetDate;
    if (body.category !== undefined) updates.category = body.category;
    if (body.color !== undefined) updates.color = body.color;
    if (body.emoji !== undefined) updates.emoji = body.emoji;

    const [goal] = await db.update(goalsTable).set(updates).where(eq(goalsTable.id, id)).returning();
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    res.json({
      id: goal.id,
      title: goal.title,
      description: goal.description ?? null,
      progress: goal.progress,
      targetDate: goal.targetDate ?? null,
      category: goal.category ?? null,
      color: goal.color ?? null,
      emoji: goal.emoji ?? null,
      createdAt: goal.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update goal");
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const { id } = DeleteGoalParams.parse(req.params);
    await db.delete(goalsTable).where(eq(goalsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete goal");
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;
