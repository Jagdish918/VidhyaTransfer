import { Router } from "express";
import { createOrder, verifyPayment, getKey } from "../controllers/payment.controller.js";
import { verifyJWT_username as verifyJWT } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.route("/create-order").post(verifyJWT, createOrder);
router.route("/verify-payment").post(verifyJWT, verifyPayment);
router.route("/get-key").get(verifyJWT, getKey);

export default router;
