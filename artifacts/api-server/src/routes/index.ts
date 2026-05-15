import { Router, type IRouter } from "express";
import healthRouter from "./health";
import oncologyRouter from "./oncology";
import symptomCheckRouter from "./symptom-check";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/oncology", oncologyRouter);
router.use("/symptom-check", symptomCheckRouter);

export default router;
