import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "Sneaker Vault",
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
      type: [
        {
          size: { type: Number, required: true },
          stock: { type: Number, required: true, default: 0, min: 0 },
        },
      ],
      default: [
        { size: 38, stock: 0 },
        { size: 39, stock: 0 },
        { size: 40, stock: 0 },
        { size: 41, stock: 0 },
        { size: 42, stock: 0 },
        { size: 43, stock: 0 },
      ],
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

productSchema.pre("validate", async function () {
  if (this.isNew && !this.sku) {
    const lastProduct = await mongoose.model("Product").findOne(
      { sku: /^SV\d+$/ },
      { sku: 1 },
      { sort: { sku: -1 } }
    );
    
    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      const match = lastProduct.sku.match(/^SV(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    this.sku = `SV${String(nextNumber).padStart(3, "0")}`;
  }
});

productSchema.pre("save", function () {
  if (this.isModified("sizes")) {
    this.stock = this.sizes.reduce((total, s) => total + s.stock, 0);
  }
});

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

