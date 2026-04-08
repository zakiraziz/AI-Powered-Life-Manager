import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import goalsRouter from "./goals";
import routinesRouter from "./routines";
import journalRouter from "./journal";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(goalsRouter);
router.use(routinesRouter);
router.use(journalRouter);
router.use(statsRouter);

export default router;
