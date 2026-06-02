import Product from "../../modules/product/product.model.js";

export const migrateProductSizes = async () => {
  try {

    const legacyProducts = await Product.find({
      $or: [
        { "sizes.0": { $type: "number" } },
        { sizes: { $size: 0 } },
        { sizes: { $exists: false } },
      ],
    });

    if (legacyProducts.length === 0) {
      return;
    }

    console.log(`Found ${legacyProducts.length} legacy products to migrate.`);

    for (const product of legacyProducts) {
      const oldSizes = product.sizes || [];
      const currentStock = product.stock || 0;

      let newSizes = [];
      if (oldSizes.length > 0 && typeof oldSizes[0] === "number") {
        const perSize = Math.floor(currentStock / oldSizes.length);
        const remainder = currentStock % oldSizes.length;
        newSizes = oldSizes.map((sizeNum, idx) => ({
          size: sizeNum,
          stock: perSize + (idx < remainder ? 1 : 0),
        }));
      } else {
        const defaultSizes = [38, 39, 40, 41, 42, 43];
        const perSize = Math.floor(currentStock / defaultSizes.length);
        const remainder = currentStock % defaultSizes.length;
        newSizes = defaultSizes.map((sizeNum, idx) => ({
          size: sizeNum,
          stock: perSize + (idx < remainder ? 1 : 0),
        }));
      }

      product.sizes = newSizes;
      product.stock = newSizes.reduce((sum, s) => sum + s.stock, 0);

      await product.save({ validateBeforeSave: false });
      console.log(
        `Migrated product "${product.name}" with stock distribution:`,
        newSizes,
      );
    }

    console.log("Product sizes migration completed successfully.");
  } catch (error) {
    console.error("Error during product sizes migration:", error);
  }
};

export const migrateProductSkus = async () => {
  try {
    const productsWithoutSku = await Product.find({
      $or: [{ sku: { $exists: false } }, { sku: null }, { sku: "" }],
    });

    if (productsWithoutSku.length === 0) {
      return;
    }

    console.log(`Found ${productsWithoutSku.length} products without SKU to migrate.`);

    for (let i = 0; i < productsWithoutSku.length; i++) {
      const product = productsWithoutSku[i];
      const lastProduct = await Product.findOne(
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
      
      product.sku = `SV${String(nextNumber).padStart(3, "0")}`;
      await product.save({ validateBeforeSave: false });
      console.log(`Migrated product "${product.name}" with auto-generated SKU: ${product.sku}`);
    }

    console.log("Product SKUs migration completed successfully.");
  } catch (error) {
    console.error("Error during product SKUs migration:", error);
  }
};
