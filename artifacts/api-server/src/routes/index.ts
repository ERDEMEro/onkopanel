import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oncologyRouter from "./oncology";
import symptomCheckRouter from "./symptom-check";
import doctorRecommendRouter from "./doctor-recommend";
import aiChatRouter from "./ai-chat";
import authRouter from "./auth";
import casesRouter from "./cases";
import griefSupportRouter from "./grief-support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/oncology", oncologyRouter);
router.use("/symptom-check", symptomCheckRouter);
router.use("/doctor-recommend", doctorRecommendRouter);
router.use("/ai-chat", aiChatRouter);
router.use(casesRouter);
router.use(griefSupportRouter);

export default router;
