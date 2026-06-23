import nodemailer from "nodemailer";
import { configEnv } from "../configs/configenv.js";

export const sendEmail = async (options) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, RESEND_API_KEY } = configEnv;

  // 1. Use Resend HTTP API if RESEND_API_KEY is defined
  if (RESEND_API_KEY) {
    try {
      const fromAddress =
        FROM_EMAIL && !FROM_EMAIL.includes("noreply@sneakervault.com")
          ? FROM_EMAIL
          : "Sneaker Vault <onboarding@resend.dev>";

      console.log(`Sending email via Resend API to: ${options.email} (from: ${fromAddress})`);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: options.email,
          subject: options.subject,
          html: options.html,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error ${response.status}: ${JSON.stringify(responseData)}`);
      }

      console.log(`Email successfully sent via Resend HTTP API to: ${options.email}. ID: ${responseData.id}`);
      return;
    } catch (error) {
      console.error("Error sending email via Resend API:", error);
      console.log("Attempting fallback...");
    }
  }

  // 2. Fallback to Nodemailer SMTP
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        connectionTimeout: 5000, // 5s connection timeout
        greetingTimeout: 5000,   // 5s greeting timeout
        socketTimeout: 5000,     // 5s socket timeout
      });

      const fromAddress =
        FROM_EMAIL && !FROM_EMAIL.includes("noreply@sneakervault.com")
          ? FROM_EMAIL
          : `Sneaker Vault <${SMTP_USER}>`;

      const message = {
        from: fromAddress,
        to: options.email,
        subject: options.subject,
        html: options.html,
      };

      await transporter.sendMail(message);
      console.log(`Email successfully sent via SMTP to: ${options.email}`);
      return;
    } catch (error) {
      console.error("Error sending email via SMTP:", error);
    }
  }

  // 3. Fallback to Mock service
  console.log("\n=================== MOCK EMAIL SERVICE ===================");
  console.log(`To:      ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log("----------------------------------------------------------");
  console.log(`Body (HTML):\n${options.html}`);
  console.log("==========================================================\n");
};
