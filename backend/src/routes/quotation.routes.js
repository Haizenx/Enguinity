import express from "express";
import { createQuotation, getQuotations, getQuotationById } from "../controllers/quotation.controller.js";

const router = express.Router();

router.post("/", createQuotation);
router.get("/", getQuotations);
router.get("/:id", getQuotationById);

export default router;
