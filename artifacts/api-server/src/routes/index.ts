import { Router, type IRouter } from "express";
import healthRouter from "./health";
import faceSwapRouter from "./faceSwap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(faceSwapRouter);

export default router;
