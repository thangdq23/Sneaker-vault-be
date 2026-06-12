import Review from "./review.model.js";
import Order from "../order/order.model.js";
import Product from "../product/product.model.js";
import createError from "../../shared/utils/createError.js";
import mongoose from "mongoose";


const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$product",
          numReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10, // rounds to 1 decimal place
        numReviews: stats[0].numReviews,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0,
      });
    }
  } catch (error) {
    console.error("Error updating product rating aggregate:", error);
  }
};


export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return createError(res, 400, "Vui lòng chọn số sao đánh giá và sản phẩm.");
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return createError(res, 400, "Số sao đánh giá phải từ 1 đến 5.");
    }

    const product = await Product.findById(productId);
    if (!product) {
      return createError(res, 404, "Sản phẩm không tồn tại.");
    }

    const order = await Order.findOne({
      user: userId,
      status: "delivered",
      "items.product": productId,
    });

    if (!order) {
      return createError(
        res,
        403,
        "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua sản phẩm này và nhận hàng thành công."
      );
    }

    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return createError(res, 400, "Bạn đã đánh giá sản phẩm này trước đó.");
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      rating: ratingNum,
      comment: comment || "",
    });

    await updateProductRating(productId);

    const populatedReview = await Review.findById(review._id).populate("user", "name email avatar");

    res.status(201).json(populatedReview);
  } catch (error) {
    next(error);
  }
};


export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};


export const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, rating, search } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let queryConditions = {};
    if (rating) {
      queryConditions.rating = parseInt(rating, 10);
    }

    if (search) {
      const matchedProducts = await Product.find({
        name: { $regex: search, $options: "i" },
      }, { _id: 1 });
      const productIds = matchedProducts.map((p) => p._id);

      const matchedUsers = await mongoose.model("User").find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }, { _id: 1 });
      const userIds = matchedUsers.map((u) => u._id);

      queryConditions.$or = [
        { product: { $in: productIds } },
        { user: { $in: userIds } },
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Review.countDocuments(queryConditions);
    const data = await Review.find(queryConditions)
      .populate("product", "name images sku brand")
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
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


export const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return createError(res, 404, "Đánh giá không tồn tại.");
    }

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return createError(res, 403, "Từ chối truy cập. Bạn không có quyền xóa đánh giá này.");
    }

    const productId = review.product;

    await Review.findByIdAndDelete(reviewId);

    await updateProductRating(productId);

    res.json({ message: "Xóa đánh giá thành công." });
  } catch (error) {
    next(error);
  }
};
