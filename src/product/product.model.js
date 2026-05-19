import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "Sneaker Vault",
    },
    category: {
      type: String,
      trim: true,
      default: "sneakers",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [Number],
      default: [38, 39, 40, 41, 42, 43],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    salePrice: {
      type: Number,
      default: null,
      min: 0,
      validate: {
        validator: function (value) {
          if (!this.isSale) return true;
          return value !== null && value !== undefined && value >= 0;
        },
        message: "salePrice is required and must be >= 0 when isSale is true",
      },
    },
    discountPercent: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
      validate: {
        validator: function (value) {
          if (!this.isSale) return true;
          return (
            value !== null && value !== undefined && value >= 0 && value <= 100
          );
        },
        message:
          "discountPercent is required and must be between 0 and 100 when isSale is true",
      },
    },
  },
  { timestamps: true },
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
