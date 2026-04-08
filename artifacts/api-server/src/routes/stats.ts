import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable, goalsTable, routinesTable, journalTable } from "@workspace/db/schema";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [taskStats] = await db.select({
      total: count(),
      completed: sql<number>`cast(sum(case when ${tasksTable.completed} then 1 else 0 end) as int)`,
    }).from(tasksTable);

    const [goalStats] = await db.select({
      inProgress: sql<number>`cast(count(*) filter (where ${goalsTable.progress} < 100) as int)`,
    }).from(goalsTable);

    const [routineStats] = await db.select({
      total: count(),
      completedToday: sql<number>`cast(sum(case when ${routinesTable.completedToday} then 1 else 0 end) as int)`,
      maxStreak: sql<number>`cast(coalesce(max(${routinesTable.streak}), 0) as int)`,
    }).from(routinesTable);

    const [journalStats] = await db.select({
      total: count(),
    }).from(journalTable);

    res.json({
      tasksCompleted: taskStats?.completed ?? 0,
      tasksTotal: taskStats?.total ?? 0,
      goalsInProgress: goalStats?.inProgress ?? 0,
      routinesStreak: routineStats?.maxStreak ?? 0,
      journalEntries: journalStats?.total ?? 0,
      routinesCompletedToday: routineStats?.completedToday ?? 0,
      routinesTotal: routineStats?.total ?? 0,
    });
  } catch (err) {
    req.log.error(err, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
