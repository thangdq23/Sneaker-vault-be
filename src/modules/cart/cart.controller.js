import Cart from "./cart.model.js";
import Product from "../product/product.model.js";
import createError from "../../shared/utils/createError.js";

const calculateTotalPrice = (cart) => {
  if (!cart || !Array.isArray(cart.items)) {
    return 0;
  }
  return cart.items.reduce((total, item) => {
    const product = item.product;
    if (!product) return total;
    const price = product.isSale && product.salePrice !== null ? product.salePrice : product.price;
    return total + price * item.quantity;
  }, 0);
};

const populateCart = async (cart) => {
  if (!cart) return null;
  await cart.populate({
    path: "items.product",
    select: "name price images brand isSale salePrice",
  });
  return {
    ...cart.toObject(),
    totalPrice: calculateTotalPrice(cart),
  };
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, size, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return createError(res, 404, "Product not found.");
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
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.json({ items: [], totalPrice: 0 });
    }

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return createError(res, 404, "Cart not found.");
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return createError(res, 404, "Cart item not found.");
    }

    item.quantity = Number(quantity);
    await cart.save();

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return createError(res, 404, "Cart not found.");
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    if (cart.items.length === initialLength) {
      return createError(res, 404, "Cart item not found.");
    }

    await cart.save();

    const result = await populateCart(cart);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return createError(res, 404, "Cart not found.");
    }

    cart.items = [];
    await cart.save();

    res.json({ items: [], totalPrice: 0 });
  } catch (error) {
    next(error);
  }
};
