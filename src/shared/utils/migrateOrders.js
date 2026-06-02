import Order from "../../modules/order/order.model.js";

export const migrateOrderCodes = async () => {
  try {
    const ordersWithoutCode = await Order.find({
      $or: [
        { orderCode: { $exists: false } },
        { orderCode: null },
        { orderCode: "" },
      ],
    }).sort({ createdAt: 1 });

    if (ordersWithoutCode.length === 0) {
      return;
    }

    console.log(`Found ${ordersWithoutCode.length} orders without code to migrate.`);

    for (let i = 0; i < ordersWithoutCode.length; i++) {
      const order = ordersWithoutCode[i];
      const lastOrder = await Order.findOne(
        { orderCode: /^SVORD\d+$/ },
        { orderCode: 1 },
        { sort: { orderCode: -1 } }
      );
      
      let nextNumber = 1;
      if (lastOrder && lastOrder.orderCode) {
        const match = lastOrder.orderCode.match(/^SVORD(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      order.orderCode = `SVORD${String(nextNumber).padStart(3, "0")}`;
      await order.save({ validateBeforeSave: false });
      console.log(`Migrated order "${order._id}" with auto-generated orderCode: ${order.orderCode}`);
    }

    console.log("Order codes migration completed successfully.");
  } catch (error) {
    console.error("Error during order codes migration:", error);
  }
};
