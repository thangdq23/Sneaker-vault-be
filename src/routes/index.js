import { Router } from "express";
import routerAuth from "../modules/auth/auth.route.js";
import routerCart from "../modules/cart/cart.route.js";
import routerProduct from "../modules/product/product.route.js";

const router = Router();

router.use("/auth", routerAuth);
router.use("/carts", routerCart);
router.use("/products", routerProduct);

export default router;
