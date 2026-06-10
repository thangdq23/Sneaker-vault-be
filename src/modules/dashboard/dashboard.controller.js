import Order from "../order/order.model.js";
import User from "../user/user.model.js";
import Product from "../product/product.model.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let startStr = startDate;
    let endStr = endDate;

    if (!startStr || !endStr) {
      const nowUtc = new Date();
      const localVnTime = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
      
      const year = localVnTime.getFullYear();
      const month = String(localVnTime.getMonth() + 1).padStart(2, "0");
      const day = String(localVnTime.getDate()).padStart(2, "0");
      
      startStr = `${year}-${month}-01`;
      endStr = `${year}-${month}-${day}`;
    }

    const startOfPeriod = new Date(`${startStr}T00:00:00+07:00`);
    const endOfPeriod = new Date(`${endStr}T23:59:59.999+07:00`);

    const deliveredOrdersInPeriod = await Order.find({
      status: "delivered",
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod }
    });
    const totalRevenue = deliveredOrdersInPeriod.reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod }
    });

    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod }
    });

    const totalProducts = await Product.countDocuments({});

    const currentRevenue = totalRevenue;

    const diffTime = Math.abs(endOfPeriod - startOfPeriod);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const chartData = [];
    if (diffDays <= 1) {
      for (let i = 0; i < 24; i++) {
        const startOfHour = new Date(startOfPeriod);
        startOfHour.setHours(i, 0, 0, 0);
        const endOfHour = new Date(startOfPeriod);
        endOfHour.setHours(i, 59, 59, 999);

        const hourlyRevenue = deliveredOrdersInPeriod
          .filter(o => o.createdAt >= startOfHour && o.createdAt <= endOfHour)
          .reduce((sum, o) => sum + o.totalAmount, 0);

        chartData.push({ label: `${i}h`, revenue: hourlyRevenue });
      }
    } else if (diffDays <= 31) {
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(startOfPeriod);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        const dailyRevenue = deliveredOrdersInPeriod
          .filter(o => o.createdAt >= startOfDay && o.createdAt <= endOfDay)
          .reduce((sum, o) => sum + o.totalAmount, 0);

        chartData.push({ label: dateStr, revenue: dailyRevenue });
      }
    } else {
      let current = new Date(startOfPeriod);
      current.setDate(1);
      const end = new Date(endOfPeriod);

      while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const label = `Tháng ${month + 1}/${year}`;

        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const monthlyRevenue = deliveredOrdersInPeriod
          .filter(o => o.createdAt >= startOfMonth && o.createdAt <= endOfMonth)
          .reduce((sum, o) => sum + o.totalAmount, 0);

        chartData.push({ label, revenue: monthlyRevenue });

        current.setMonth(current.getMonth() + 1);
      }
    }

    const pending = await Order.countDocuments({ status: "pending", createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } });
    const confirmed = await Order.countDocuments({ status: { $in: ["confirmed", "processing"] }, createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } });
    const shipping = await Order.countDocuments({ status: { $in: ["shipping", "shipped"] }, createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } });
    const delivered = await Order.countDocuments({ status: "delivered", createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } });
    const cancelled = await Order.countDocuments({ status: "cancelled", createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } });

    const allActiveOrders = await Order.find({
      status: { $ne: "cancelled" },
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod }
    }).populate("items.product", "name images");

    const productSales = {};
    for (const o of allActiveOrders) {
      for (const item of o.items) {
        const product = item.product;
        if (!product) continue;
        const pId = product._id.toString();

        if (!productSales[pId]) {
          productSales[pId] = {
            productId: pId,
            name: product.name,
            image: product.images && product.images.length > 0 ? product.images[0] : "",
            quantitySold: 0,
            revenue: 0
          };
        }
        productSales[pId].quantitySold += item.quantity;
        productSales[pId].revenue += item.price * item.quantity;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name");

    const recentOrdersData = recentOrders.map((o) => ({
      _id: o._id,
      orderCode: o.orderCode,
      customerName: o.user ? o.user.name : "Khách vãng lai",
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt
    }));

    const lowStockProducts = await Product.find({ stock: { $lte: 10 } })
      .sort({ stock: 1 })
      .select("name images stock");

    const lowStockData = lowStockProducts.map((p) => ({
      _id: p._id,
      name: p.name,
      image: p.images && p.images.length > 0 ? p.images[0] : "",
      stock: p.stock
    }));

    res.json({
      overview: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts
      },
      periodRevenue: {
        currentRevenue
      },
      chartData,
      orderStatuses: {
        pending,
        confirmed,
        shipping,
        delivered,
        cancelled
      },
      topProducts,
      recentOrders: recentOrdersData,
      lowStockProducts: lowStockData
    });
  } catch (error) {
    next(error);
  }
};
