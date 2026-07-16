import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import destinationsRouter from "./destinations";
import categoriesRouter from "./categories";
import toursRouter from "./tours";
import reviewsRouter from "./reviews";
import bookingsRouter from "./bookings";
import wishlistRouter from "./wishlist";
import statsRouter from "./stats";
import vendorRouter from "./vendor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(destinationsRouter);
router.use(categoriesRouter);
router.use(toursRouter);
router.use(reviewsRouter);
router.use(bookingsRouter);
router.use(wishlistRouter);
router.use(statsRouter);
router.use(vendorRouter);

export default router;
