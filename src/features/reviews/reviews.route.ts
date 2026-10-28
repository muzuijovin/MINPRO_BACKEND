import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auths.middleware";
import { ReviewsController } from "./reviews.controller";

export const ReviewsRoute = Router();

// hanya customer yang sudah hadir (punya transaksi PAID & event sudah selesai) yang boleh review, dicek di service
ReviewsRoute.post("/", authenticate, authorize(["CUSTOMER"]), ReviewsController.createReview);

// publik, dipakai di halaman detail event (?eventId=) & profil EO (?organizerId=)
ReviewsRoute.get("/", ReviewsController.getReviews);
