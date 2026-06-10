import { Router } from "express";
import routerAuth from "../modules/auth/auth.route.js";
import routerCart from "../modules/cart/cart.route.js";
import routerProduct from "../modules/product/product.route.js";
import routerUser from "../modules/user/user.route.js";
import routerOrder from "../modules/order/order.route.js";
import routerDashboard from "../modules/dashboard/dashboard.route.js";

const router = Router();

router.use("/auth", routerAuth);
router.use("/cart", routerCart);
router.use("/products", routerProduct);
router.use("/users", routerUser);
router.use("/orders", routerOrder);
router.use("/dashboard", routerDashboard);

export default router;
