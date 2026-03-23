import { Router } from "express";
import { createOrder, verifyPayment, getKey, getTransactions, transferCredits } from "../controllers/payment.controller.js";
import { verifyJWT_username as verifyJWT } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.route("/create-order").post(verifyJWT, createOrder);
router.route("/verify-payment").post(verifyJWT, verifyPayment);
router.route("/get-key").get(verifyJWT, getKey);
router.route("/history").get(verifyJWT, getTransactions);
router.route("/transfer-credits").post(verifyJWT, transferCredits);

export default router;
