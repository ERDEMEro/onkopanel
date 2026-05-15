import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oncologyRouter from "./oncology";
import symptomCheckRouter from "./symptom-check";
import doctorRecommendRouter from "./doctor-recommend";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/oncology", oncologyRouter);
router.use("/symptom-check", symptomCheckRouter);
router.use("/doctor-recommend", doctorRecommendRouter);

export default router;
