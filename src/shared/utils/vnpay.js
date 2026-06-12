import crypto from "crypto";


export function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    const rawVal = obj[str[key]];
    if (rawVal !== undefined && rawVal !== null) {
      sorted[str[key]] = encodeURIComponent(rawVal.toString()).replace(/%20/g, "+");
    }
  }
  return sorted;
}


export function createVNPAYPaymentUrl({ ipAddr, amount, orderCode, returnUrl, tmnCode, hashSecret, vnpUrl }) {
  const date = new Date();
  
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const ictTime = new Date(utc + (3600000 * 7));
  
  const pad = (n) => String(n).padStart(2, '0');
  const vnp_CreateDate = ictTime.getFullYear() +
    pad(ictTime.getMonth() + 1) +
    pad(ictTime.getDate()) +
    pad(ictTime.getHours()) +
    pad(ictTime.getMinutes()) +
    pad(ictTime.getSeconds());

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderCode,
    vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(amount) * 100, // VNPAY expects amount in cents/VND*100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: vnp_CreateDate,
  };

  const sortedParams = sortObject(vnp_Params);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');
    
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  
  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
}


export function verifyVNPAYSignature(queryParams, hashSecret) {
  const secureHash = queryParams["vnp_SecureHash"];
  
  const params = { ...queryParams };
  delete params["vnp_SecureHash"];
  delete params["vnp_SecureHashType"];
  
  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');
    
  const hmac = crypto.createHmac("sha512", hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  
  return secureHash === signed;
}
