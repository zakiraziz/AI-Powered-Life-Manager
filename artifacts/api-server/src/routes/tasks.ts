import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateTaskBody, UpdateTaskBody, UpdateTaskParams, DeleteTaskParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    const mapped = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      completed: t.completed,
      priority: t.priority,
      category: t.category ?? null,
      dueDate: t.dueDate ?? null,
      createdAt: t.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err, "Failed to get tasks");
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const body = CreateTaskBody.parse(req.body);
    const [task] = await db.insert(tasksTable).values({
      title: body.title,
      description: body.description ?? null,
      priority: body.priority,
      category: body.category ?? null,
      dueDate: body.dueDate ?? null,
    }).returning();
    res.status(201).json({
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      completed: task.completed,
      priority: task.priority,
      category: task.category ?? null,
      dueDate: task.dueDate ?? null,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create task");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse(req.params);
    const body = UpdateTaskBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.category !== undefined) updates.category = body.category;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;

    const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      completed: task.completed,
      priority: task.priority,
      category: task.category ?? null,
      dueDate: task.dueDate ?? null,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to update task");
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse(req.params);
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Failed to delete task");
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
