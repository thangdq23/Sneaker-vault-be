import Order from "./order.model.js";
import Cart from "../cart/cart.model.js";
import Product from "../product/product.model.js";
import { queryBuilder } from "../../shared/utils/queryBuilder.js";
import createError from "../../shared/utils/createError.js";

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, phone, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return createError(res, 400, "Your cart is empty.");
    }

    const orderItems = [];
    let totalAmount = 0;

    // Validate stock and build order items
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        return createError(
          res,
          404,
          "One of the products in your cart no longer exists.",
        );
      }

      const sizeItem = product.sizes.find((s) => s.size === item.size);
      if (!sizeItem) {
        return createError(
          res,
          400,
          `Product "${product.name}" does not support size ${item.size}.`,
        );
      }

      if (sizeItem.stock < item.quantity) {
        return createError(
          res,
          400,
          `Insufficient stock for product "${product.name}" (size ${item.size}). Only ${sizeItem.stock} items left in stock.`,
        );
      }

      const price =
        product.isSale && product.salePrice !== null
          ? product.salePrice
          : product.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        product: product._id,
        size: item.size,
        quantity: item.quantity,
        price,
      });
    }

    // Create the order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      phone,
      totalAmount,
      paymentMethod,
    });

    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product._id, "sizes.size": item.size },
        {
          $inc: {
            "sizes.$.stock": -item.quantity,
            stock: -item.quantity,
          },
        },
      );
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const result = await queryBuilder(
      Order,
      { ...req.query, user: req.user.id },
      {
        populate: [
          { path: "items.product", select: "name price images brand category" },
        ],
      },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) {
      return createError(res, 404, "Order not found.");
    }

    if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
      return createError(res, 403, "Access denied. You do not own this order.");
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return createError(res, 404, "Order not found.");
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ message: "Order status updated successfully.", order });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const result = await queryBuilder(Order, req.query, {
      populate: [
        { path: "items.product", select: "name price images brand category" },
        { path: "user", select: "name email" },
      ],
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
