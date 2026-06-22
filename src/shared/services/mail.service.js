import Order from "../../modules/order/order.model.js";
import { sendEmail } from "../utils/sendEmail.js";

const formatVnd = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// Base layout styles
const emailHeaderStyle = `
  background-color: #09090b;
  padding: 32px 24px;
  text-align: center;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
`;

const emailBodyStyle = `
  background-color: #ffffff;
  padding: 32px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #27272a;
`;

const emailFooterStyle = `
  background-color: #f4f4f5;
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: #71717a;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  border-top: 1px solid #e4e4e7;
`;

export const sendOrderConfirmationEmail = async (orderId) => {
  try {
    // Atomically check and mark as sent to prevent duplicate calls from vnpayReturn & vnpayIpn
    const order = await Order.findOneAndUpdate(
      { _id: orderId, isEmailSent: { $ne: true } },
      { $set: { isEmailSent: true } },
      { new: true }
    ).populate("items.product").populate("user");

    if (!order) {
      console.log(`Email already sent or order not found for ID: ${orderId}`);
      return;
    }

    const user = order.user;
    if (!user || !user.email) {
      console.error(`User email not found for order confirmation: ${order.orderCode}`);
      return;
    }

    const itemsHtml = order.items.map((item) => {
      const product = item.product;
      const productName = product ? product.name : "Sản phẩm Sneaker";
      const productImg = product && product.images && product.images[0]
        ? product.images[0]
        : "https://via.placeholder.com/100?text=Sneaker";
      const brandName = product ? product.brand : "";
      
      return `
        <tr style="border-b: 1px solid #e4e4e7;">
          <td style="padding: 16px 0; vertical-align: middle; width: 64px;">
            <img src="${productImg}" alt="${productName}" width="56" height="56" style="border-radius: 8px; object-fit: cover; border: 1px solid #e4e4e7;" />
          </td>
          <td style="padding: 16px 12px; vertical-align: middle;">
            <div style="font-weight: 700; font-size: 14px; color: #09090b;">${productName}</div>
            <div style="font-size: 12px; color: #71717a; margin-top: 2px;">
              ${brandName ? `Thương hiệu: ${brandName} | ` : ""}Size: ${item.size}
            </div>
          </td>
          <td style="padding: 16px 12px; text-align: center; vertical-align: middle; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 16px 0; text-align: right; vertical-align: middle; font-weight: 600; font-size: 14px; color: #09090b;">
            ${formatVnd(item.price * item.quantity)}
          </td>
        </tr>
      `;
    }).join("");

    const paymentMethodText = order.paymentMethod === "cod"
      ? "Thanh toán khi nhận hàng (COD)"
      : "Thanh toán trực tuyến qua VNPAY Gateway";

    const paymentStatusText = order.paymentStatus === "paid"
      ? "Đã thanh toán"
      : order.paymentMethod === "cod"
        ? "Chưa thanh toán (COD)"
        : "Chưa thanh toán";

    const orderStatusText = order.status === "confirmed"
      ? "Đã xác nhận"
      : "Chờ xác nhận";

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="${emailHeaderStyle}">
          <h1 style="color: #ffffff; font-family: 'Montserrat', 'Helvetica', Arial, sans-serif; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SNEAKER VAULT</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin: 8px 0 0 0;">Cổng thông tin đơn hàng của bạn</p>
        </div>

        <!-- Body -->
        <div style="${emailBodyStyle}">
          <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 8px;">Cảm ơn ${user.name || "quý khách"}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #71717a; margin-top: 0; margin-bottom: 24px;">
            Đơn hàng của bạn đã được đặt thành công. Dưới đây là thông tin chi tiết về đơn hàng của bạn:
          </p>

          <!-- Order Code & Date Card -->
          <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e4e4e7;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #71717a;">Mã đơn hàng:</td>
                <td style="font-size: 13px; color: #71717a; text-align: right;">Ngày đặt hàng:</td>
              </tr>
              <tr>
                <td style="font-size: 16px; font-weight: 700; color: #09090b; padding-top: 4px;">#${order.orderCode}</td>
                <td style="font-size: 15px; font-weight: 600; color: #09090b; text-align: right; padding-top: 4px;">${formatDate(order.createdAt)}</td>
              </tr>
            </table>
          </div>

          <!-- Product Table -->
          <h3 style="font-size: 15px; font-weight: 700; color: #09090b; border-bottom: 2px solid #f4f4f5; padding-bottom: 8px; margin-top: 0; margin-bottom: 0;">Sản phẩm đặt mua</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #e4e4e7; font-size: 12px; color: #71717a; text-transform: uppercase;">
                <th style="padding: 12px 0; text-align: left; font-weight: 600;">Ảnh</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Tên</th>
                <th style="padding: 12px; text-align: center; font-weight: 600;">SL</th>
                <th style="padding: 12px 0; text-align: right; font-weight: 600;">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Amount Totals -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #71717a;">Tạm tính:</td>
              <td style="padding: 8px 0; text-align: right; color: #09090b;">${formatVnd(order.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #71717a;">Phí vận chuyển:</td>
              <td style="padding: 8px 0; text-align: right; color: #09090b;">Miễn phí</td>
            </tr>
            <tr style="border-top: 1px solid #e4e4e7; font-size: 16px; font-weight: 700;">
              <td style="padding: 16px 0 0 0; color: #09090b;">Tổng cộng:</td>
              <td style="padding: 16px 0 0 0; text-align: right; color: #ef4444;">${formatVnd(order.totalAmount)}</td>
            </tr>
          </table>

          <!-- Info Details Cards -->
          <div style="border-top: 1px solid #f4f4f5; padding-top: 24px; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="width: 50%; padding-bottom: 16px; vertical-align: top;">
                  <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Phương thức thanh toán</div>
                  <div style="font-size: 13px; color: #09090b; font-weight: 600; margin-top: 4px;">${paymentMethodText}</div>
                </td>
                <td style="width: 50%; padding-bottom: 16px; vertical-align: top;">
                  <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Trạng thái thanh toán</div>
                  <div style="font-size: 13px; color: ${order.paymentStatus === "paid" ? "#10b981" : "#f59e0b"}; font-weight: 700; margin-top: 4px;">${paymentStatusText}</div>
                </td>
              </tr>
              <tr>
                <td style="width: 50%; padding-bottom: 16px; vertical-align: top;">
                  <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Trạng thái đơn hàng</div>
                  <div style="font-size: 13px; color: ${order.status === "confirmed" ? "#10b981" : "#f59e0b"}; font-weight: 700; margin-top: 4px;">${orderStatusText}</div>
                </td>
                <td style="width: 50%; padding-bottom: 16px; vertical-align: top;"></td>
              </tr>
            </table>
            
            <div style="border-top: 1px dashed #e4e4e7; padding-top: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px;">Địa chỉ giao hàng</div>
              <div style="font-size: 13px; color: #09090b; line-height: 1.5; margin-top: 4px;">
                <strong>Người nhận/SĐT:</strong> ${order.phone}<br/>
                <strong>Địa chỉ:</strong> ${order.shippingAddress}
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 8px;">
            <a href="https://sneaker-vault-shop.vercel.app/profile" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(9, 9, 11, 0.25);">
              Theo dõi đơn hàng của bạn
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="${emailFooterStyle}">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #09090b;">SNEAKER VAULT STORE</p>
          <p style="margin: 0 0 16px 0; line-height: 1.5;">Hệ thống cung cấp giày thể thao chính hãng và cao cấp hàng đầu.</p>
          <p style="margin: 0; font-size: 10px; color: #a1a1aa;">Email này được gửi tự động. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: `Xác nhận đơn hàng thành công #${order.orderCode} - Sneaker Vault`,
      html: emailHtml,
    });
  } catch (err) {
    console.error(`Error processing/sending order confirmation email:`, err);
  }
};

export const sendOrderStatusEmail = async (orderId, newStatus) => {
  try {
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      console.error(`Order not found for status update email: ${orderId}`);
      return;
    }

    const user = order.user;
    if (!user || !user.email) {
      console.error(`User email not found for status email: ${order.orderCode}`);
      return;
    }

    let statusTitle = "";
    let statusMessage = "";
    let statusColor = "#3b82f6"; // default blue

    if (newStatus === "confirmed" || newStatus === "processing") {
      statusTitle = "Đơn hàng đã được xác nhận";
      statusMessage = "Đơn hàng của bạn đã được xác nhận thành công và đang được chuẩn bị đóng gói tại kho.";
      statusColor = "#10b981"; // green
    } else if (newStatus === "shipping" || newStatus === "shipped") {
      statusTitle = "Đơn hàng đang được giao";
      statusMessage = "Đơn hàng của bạn đang trên đường giao tới địa chỉ nhận hàng của bạn. Vui lòng chú ý điện thoại liên hệ.";
      statusColor = "#f59e0b"; // yellow
    } else if (newStatus === "delivered") {
      statusTitle = "Đơn hàng đã giao thành công";
      statusMessage = "Đơn hàng của bạn đã được giao thành công! Cảm ơn bạn rất nhiều vì đã tin tưởng lựa chọn mua sắm tại Sneaker Vault.";
      statusColor = "#10b981"; // green
    } else if (newStatus === "cancelled") {
      statusTitle = "Đơn hàng đã bị hủy";
      statusMessage = "Đơn hàng của bạn đã bị hủy trên hệ thống.";
      statusColor = "#ef4444"; // red
    } else {
      return;
    }

    let cancelReasonHtml = "";
    if (newStatus === "cancelled") {
      const reason = order.cancelReason || "Khác";
      const note = order.cancelNote ? ` (${order.cancelNote})` : "";
      cancelReasonHtml = `
        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px; margin-bottom: 24px; margin-top: 16px;">
          <strong style="color: #b91c1c; font-size: 14px;">Lý do hủy đơn:</strong>
          <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 13px;">${reason}${note}</p>
        </div>
      `;
    }

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="${emailHeaderStyle}">
          <h1 style="color: #ffffff; font-family: 'Montserrat', 'Helvetica', Arial, sans-serif; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SNEAKER VAULT</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin: 8px 0 0 0;">Cập nhật trạng thái đơn hàng</p>
        </div>

        <!-- Body -->
        <div style="${emailBodyStyle}">
          <!-- Status Banner Indicator -->
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-block; background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30; border-radius: 20px; padding: 6px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${statusTitle}
            </div>
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 16px; margin-bottom: 0;">Đơn hàng #${order.orderCode}</h2>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #09090b; margin-top: 0; margin-bottom: 16px;">
            Xin chào <strong>${user.name || "quý khách"}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #71717a; margin-top: 0; margin-bottom: 24px;">
            ${statusMessage}
          </p>

          ${cancelReasonHtml}

          <!-- Order Summary Card -->
          <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #e4e4e7; font-size: 14px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #71717a; padding-bottom: 8px;">Mã đơn hàng:</td>
                <td style="text-align: right; color: #09090b; font-weight: 700; padding-bottom: 8px;">#${order.orderCode}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding-bottom: 8px;">Ngày đặt hàng:</td>
                <td style="text-align: right; color: #09090b; font-weight: 600; padding-bottom: 8px;">${formatDate(order.createdAt)}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding-bottom: 8px;">Tổng thanh toán:</td>
                <td style="text-align: right; color: #ef4444; font-weight: 700; padding-bottom: 8px;">${formatVnd(order.totalAmount)}</td>
              </tr>
              <tr style="border-top: 1px solid #e4e4e7;">
                <td style="color: #71717a; padding-top: 12px;">Địa chỉ nhận hàng:</td>
                <td style="text-align: right; color: #09090b; font-weight: 500; padding-top: 12px; line-height: 1.4;">
                  ${order.shippingAddress}
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 8px;">
            <a href="https://sneaker-vault-shop.vercel.app/profile" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(9, 9, 11, 0.25);">
              Xem chi tiết đơn hàng
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="${emailFooterStyle}">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #09090b;">SNEAKER VAULT STORE</p>
          <p style="margin: 0 0 16px 0; line-height: 1.5;">Hệ thống cung cấp giày thể thao chính hãng và cao cấp hàng đầu.</p>
          <p style="margin: 0; font-size: 10px; color: #a1a1aa;">Email này được gửi tự động. Vui lòng không phản hồi trực tiếp email này.</p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: `[Cập nhật] ${statusTitle} #${order.orderCode} - Sneaker Vault`,
      html: emailHtml,
    });
  } catch (err) {
    console.error(`Error processing/sending order status email:`, err);
  }
};
