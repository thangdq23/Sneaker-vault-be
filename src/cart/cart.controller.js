import mongoose from "mongoose";
import Cart from "./cart.model.js";
import Product from "../product/product.model.js";

const calculateTotalPrice = (cart) => {
  if (!cart || !Array.isArray(cart.items)) {
    return 0;
  }
  return cart.items.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);
};

const populateCart = async (cart) => {
  if (!cart) return null;
  await cart.populate({
    path: "items.product",
    select: "name price images brand category",
  });
  return {
    ...cart.toObject(),
    totalPrice: calculateTotalPrice(cart),
  };
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      productId: bodyProductId,
      product_id,
      product: bodyProduct,
      size: bodySize,
      quantity: bodyQuantity = 1,
    } = req.body || {};

    const productId = bodyProductId || product_id || bodyProduct;
    const size = Number(bodySize);
    const quantity = Number(bodyQuantity);

    if (!productId || !bodySize) {
      return res
        .status(400)
        .json({ error: "productId and size are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid productId format." });
    }
    if (!Number.isInteger(size) || size <= 0) {
      return res
        .status(400)
        .json({ error: "size must be a positive integer." });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive integer." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId && item.size === size,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        size,
        quantity,
      });
    }

    await cart.save();
    const result = await populateCart(cart);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to add item to cart.",
      detail: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.json({ items: [], totalPrice: 0 });
    }

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch cart." });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1." });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    item.quantity = Number(quantity);
    await cart.save();

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update cart item." });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    await cart.save();

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove cart item." });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found." });
    }

    cart.items = [];
    await cart.save();

    res.json({ items: [], totalPrice: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to clear cart." });
  }
};
