import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { routinesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateRoutineBody, UpdateRoutineBody, UpdateRoutineParams, DeleteRoutineParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/routines", async (req, res) => {
  try {
    const routines = await db.select().from(routinesTable).orderBy(routinesTable.createdAt);
    const mapped = routines.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description ?? null,
      time: r.time ?? null,
      emoji: r.emoji ?? null,
      streak: r.streak,
      completedToday: r.completedToday,
      frequency: r.frequency,
      createdAt: r.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err, "Failed to get routines");
    res.status(500).json({ error: "Failed to get routines" });
  }
});

router.post("/routines", async (req, res) => {
  try {
    const body = CreateRoutineBody.parse(req.body);
    const [routine] = await db.insert(routinesTable).values({
      title: body.title,
      description: body.description ?? null,
      time: body.time ?? null,
      emoji: body.emoji ?? null,
      frequency: body.frequency,
    }).returning();
    res.status(201).json({
      id: routine.id,
      title: routine.title,
      description: routine.description ?? null,
      time: routine.time ?? null,
      emoji: routine.emoji ?? null,
      streak: routine.streak,
      completedToday: routine.completedToday,
      frequency: routine.frequency,
      createdAt: routine.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create routine");
    res.status(500).json({ error: "Failed to create routine" });
  }
});

router.patch("/routines/:id", async (req, res) => {
  try {
    const { id } = UpdateRoutineParams.parse(req.params);
    const body = UpdateRoutineBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.time !== undefined) updates.time = body.time;
    if (body.emoji !== undefined) updates.emoji = body.emoji;
    if (body.streak !== undefined) updates.streak = body.streak;
    if (body.completedToday !== undefined) updates.completedToday = body.completedToday;
    if (body.frequency !== undefined) updates.frequency = body.frequency;

    const [routine] = await db.update(routinesTable).set(updates).where(eq(routinesTable.id, id)).returning();
    if (!routine) return res.status(404).json({ error: "Routine not found" });
    res.json({
      id: routine.id,
      title: routine.title,
      description: routine.description ?? null,
      time: routine.time ?? null,
      emoji: routine.emoji ?? null,
      streak: routine.streak,
      completedToday: routine.completedToday,
      frequency: routine.frequency,
      createdAt: routine.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update routine");
    res.status(500).json({ error: "Failed to update routine" });
  }
});

router.delete("/routines/:id", async (req, res) => {
  try {
    const { id } = DeleteRoutineParams.parse(req.params);
    await db.delete(routinesTable).where(eq(routinesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete routine");
    res.status(500).json({ error: "Failed to delete routine" });
  }
});

export default router;
