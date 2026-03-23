import express from "express";
import { rateUser, getRatings } from "../controllers/user/rating.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRatingSchema } from "../validators/extra.validators.js";

const router = express.Router();

router.post("/rateUser", verifyJWT_username, validate(createRatingSchema), rateUser);
router.get("/getRatings/:username", verifyJWT_username, getRatings);

export default router;
