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
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
);

productSchema.virtual("formattedPrice").get(function () {
  if (this.price === null || this.price === undefined) return "0 đ";
  return `${this.price.toLocaleString("vi-VN")} đ`;
});

productSchema.virtual("formattedSalePrice").get(function () {
  if (this.salePrice === null || this.salePrice === undefined) return null;
  return `${this.salePrice.toLocaleString("vi-VN")} đ`;
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;

