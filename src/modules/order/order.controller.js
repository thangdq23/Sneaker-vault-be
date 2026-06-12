import Order from "./order.model.js";
import Cart from "../cart/cart.model.js";
import Product from "../product/product.model.js";
import User from "../user/user.model.js";
import { queryBuilder } from "../../shared/utils/queryBuilder.js";
import createError from "../../shared/utils/createError.js";
import { createVNPAYPaymentUrl, verifyVNPAYSignature } from "../../shared/utils/vnpay.js";
import { configEnv } from "../../shared/configs/configenv.js";

export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.isActive === false) {
      return createError(res, 403, "Tài khoản của bạn đã bị khóa. Không thể thực hiện đặt hàng.");
    }

    const { shippingAddress, phone, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return createError(res, 400, "Your cart is empty.");
    }

    const orderItems = [];
    let totalAmount = 0;

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
          `Sản phẩm không đủ hàng tồn kho "${product.name}" (size ${item.size}). Chỉ còn ${sizeItem.stock} số lượng hàng còn lại trong kho.`,
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

    if (paymentMethod !== "card") {
      cart.items = [];
      await cart.save();
    }

    let paymentUrl = null;
    if (paymentMethod === "card") {
      const ipAddr = req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
        "127.0.0.1";
        
      paymentUrl = createVNPAYPaymentUrl({
        ipAddr,
        amount: totalAmount,
        orderCode: order.orderCode,
        returnUrl: `${configEnv.CLIENT_URL}/payment/vnpay-return`,
        tmnCode: configEnv.VNPAY_TMN_CODE,
        hashSecret: configEnv.VNPAY_HASH_SECRET,
        vnpUrl: configEnv.VNPAY_URL,
      });
    }

    if (paymentUrl) {
      res.status(201).json({
        ...order.toObject(),
        paymentUrl,
      });
    } else {
      res.status(201).json(order);
    }
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
          { path: "items.product", select: "name price images brand" },
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
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price images brand sku")
      .populate("user", "name email");
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

const getStatusText = (status) => {
  const map = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    processing: "Đã xác nhận",
    shipping: "Đang giao",
    shipped: "Đang giao",
    delivered: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return map[status] || status;
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return createError(res, 404, "Order not found.");
    }

    if (status) {
      const currentStatus = order.status;
      const newStatus = status;

      if (currentStatus !== newStatus) {
        const validTransitions = {
          pending: ["confirmed", "cancelled"],
          confirmed: ["shipping", "cancelled"],
          processing: ["shipping", "shipped", "delivered", "cancelled"],
          shipping: ["delivered"],
          shipped: ["delivered"],
          delivered: [],
          cancelled: [],
        };

        const allowed = validTransitions[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
          return createError(
            res,
            400,
            `Không thể chuyển trạng thái đơn hàng từ "${getStatusText(currentStatus)}" sang "${getStatusText(newStatus)}".`
          );
        }
        order.status = newStatus;
        if (newStatus === "delivered") {
          order.paymentStatus = "paid";
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    res.json({ message: "Cập nhật trạng thái đơn hàng thành công.", order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return createError(res, 404, "Order not found.");
    }

    if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
      return createError(res, 403, "Access denied. You do not own this order.");
    }

    const currentStatus = order.status;
    if (currentStatus === "cancelled") {
      return createError(res, 400, "Đơn hàng đã được hủy trước đó.");
    }

    if (currentStatus !== "pending" && currentStatus !== "confirmed" && currentStatus !== "processing") {
      return createError(
        res,
        400,
        `Không thể hủy đơn hàng ở trạng thái "${getStatusText(currentStatus)}".`
      );
    }

    const { cancelReason, cancelNote } = req.body;

    if (!cancelReason) {
      return createError(res, 400, "Vui lòng chọn lý do hủy đơn hàng.");
    }

    const validReasons = [
      "Khách đổi ý",
      "Không liên lạc được khách",
      "Hết hàng",
      "Sai thông tin giao hàng",
      "Khác",
    ];

    if (!validReasons.includes(cancelReason)) {
      return createError(res, 400, "Lý do hủy đơn hàng không hợp lệ.");
    }

    if (cancelReason === "Khác" && (!cancelNote || !cancelNote.trim())) {
      return createError(res, 400, "Vui lòng nhập ghi chú bổ sung khi chọn lý do Khác.");
    }

    order.status = "cancelled";
    order.cancelReason = cancelReason;
    order.cancelNote = cancelNote || null;
    order.cancelledAt = new Date();
    await order.save();

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size },
        {
          $inc: {
            "sizes.$.stock": item.quantity,
            stock: item.quantity,
          },
        }
      );
    }

    res.json({ message: "Hủy đơn hàng thành công và đã hoàn lại tồn kho.", order });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, search, sort = "createdAt", order = "desc" } = req.query;
    const queryConditions = {};

    if (status && status !== "all") {
      queryConditions.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const users = await User.find({ name: searchRegex }).select("_id");
      const userIds = users.map((u) => u._id);

      queryConditions.$or = [
        { orderCode: searchRegex },
        { phone: searchRegex },
      ];

      if (userIds.length > 0) {
        queryConditions.$or.push({ user: { $in: userIds } });
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === "desc" ? -1 : 1;

    const total = await Order.countDocuments(queryConditions);
    const data = await Order.find(queryConditions)
      .populate("items.product", "name price images brand sku")
      .populate("user", "name email")
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const vnpayReturn = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const isValidSignature = verifyVNPAYSignature(queryParams, configEnv.VNPAY_HASH_SECRET);
    if (!isValidSignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const orderCode = queryParams["vnp_TxnRef"];
    const responseCode = queryParams["vnp_ResponseCode"];
    const vnpAmount = Number(queryParams["vnp_Amount"]) / 100;

    const order = await Order.findOne({ orderCode }).populate("items.product");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (responseCode === "00") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      await order.save();

      // Clear user's cart after successful payment verification
      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      return res.status(200).json({ success: true, order });
    } else {
      if (order.status !== "cancelled") {
        order.paymentStatus = "failed";
        order.status = "cancelled";
        order.cancelReason = "Khác";
        order.cancelNote = `Thanh toán VNPAY thất bại (mã lỗi: ${responseCode})`;
        order.cancelledAt = new Date();
        await order.save();

        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product, "sizes.size": item.size },
            {
              $inc: {
                "sizes.$.stock": item.quantity,
                stock: item.quantity,
              },
            }
          );
        }
      }
      return res.status(200).json({ success: false, code: responseCode, order });
    }
  } catch (error) {
    next(error);
  }
};

export const vnpayIpn = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const isValidSignature = verifyVNPAYSignature(queryParams, configEnv.VNPAY_HASH_SECRET);
    if (!isValidSignature) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const orderCode = queryParams["vnp_TxnRef"];
    const responseCode = queryParams["vnp_ResponseCode"];
    const vnpAmount = Number(queryParams["vnp_Amount"]) / 100;

    const order = await Order.findOne({ orderCode }).populate("items.product");
    if (!order) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    if (Math.round(order.totalAmount) !== Math.round(vnpAmount)) {
      return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
    }

    if (order.paymentStatus === "paid" || order.paymentStatus === "failed") {
      return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (responseCode === "00") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      await order.save();

      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } else {
      order.paymentStatus = "failed";
      order.status = "cancelled";
      order.cancelReason = "Khác";
      order.cancelNote = `Thanh toán VNPAY thất bại (mã lỗi: ${responseCode})`;
      order.cancelledAt = new Date();
      await order.save();

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, "sizes.size": item.size },
          {
            $inc: {
              "sizes.$.stock": item.quantity,
              stock: item.quantity,
            },
          }
        );
      }
    }

    return res.status(200).json({ RspCode: "00", Message: "Confirm success" });
  } catch (error) {
    next(error);
  }
};
