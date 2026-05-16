import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oncologyRouter from "./oncology";
import symptomCheckRouter from "./symptom-check";
import doctorRecommendRouter from "./doctor-recommend";
import aiChatRouter from "./ai-chat";
import authRouter from "./auth";
import casesRouter from "./cases";
import griefSupportRouter from "./grief-support";
import caregiverSupportRouter from "./caregiver-support";
import nutritionAdvisorRouter from "./nutrition-advisor";
import mealPlanRouter from "./meal-plan";
import oncologyNewsRouter from "./oncology-news";
import priorityPanelRouter from "./priority-panel";
import aiAdvisorRouter from "./ai-advisor";
import exercisePlanRouter from "./exercise-plan";
import supportPlanRouter from "./support-plan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/oncology", oncologyRouter);
router.use("/symptom-check", symptomCheckRouter);
router.use("/doctor-recommend", doctorRecommendRouter);
router.use("/ai-chat", aiChatRouter);
router.use(casesRouter);
router.use(griefSupportRouter);
router.use(caregiverSupportRouter);
router.use(nutritionAdvisorRouter);
router.use(mealPlanRouter);
router.use(oncologyNewsRouter);
router.use(priorityPanelRouter);
router.use(aiAdvisorRouter);
router.use(exercisePlanRouter);
router.use(supportPlanRouter);

export default router;
