import express from "express";
import { createReport } from "../controllers/user/report.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createReportSchema } from "../validators/extra.validators.js";

const router = express.Router();

router.route("/create").post(verifyJWT_username, validate(createReportSchema), createReport);
// router.get("/", verifyJWT_username, getRequests);

export default router;
