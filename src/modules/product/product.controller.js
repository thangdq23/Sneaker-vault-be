import Product from "./product.model.js";
import { queryBuilder } from "../../shared/utils/queryBuilder.js";
import createError from "../../shared/utils/createError.js";

export const getProducts = async (req, res, next) => {
  try {
    const { minPrice, maxPrice, ...restQuery } = req.query;
    const queryParams = {
      ...restQuery,
      searchFields: ["name", "brand", "category", "description"],
    };
    if (minPrice !== undefined) queryParams.priceMin = minPrice;
    if (maxPrice !== undefined) queryParams.priceMax = maxPrice;

    const result = await queryBuilder(Product, queryParams);

    res.json({
      products: result.data,
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
      totalPages: result.meta.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return createError(res, 404, "Product not found.");
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.name) {
        return createError(res, 409, "Product name already exists.");
      }
      if (error.keyPattern.sku) {
        return createError(res, 409, "SKU already exists.");
      }
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return createError(res, 404, "Product not found.");
    }
    product.set(req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.name) {
        return createError(res, 409, "Product name already exists.");
      }
      if (error.keyPattern.sku) {
        return createError(res, 409, "SKU already exists.");
      }
    }
    next(error);
  }
};

export const updateProductSizeStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { size, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return createError(res, 404, "Product not found.");
    }

    const sizeObj = product.sizes.find((s) => s.size === size);
    if (!sizeObj) {
      product.sizes.push({ size, stock });
    } else {
      sizeObj.stock = stock;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return createError(res, 404, "Product not found.");
    }
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
};
