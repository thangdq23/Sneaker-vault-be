import nodemailer from "nodemailer";
import { configEnv } from "../configs/configenv.js";

export const sendEmail = async (options) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } = configEnv;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const message = {
        from: FROM_EMAIL,
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

  console.log("\n=================== MOCK EMAIL SERVICE ===================");
  console.log(`To:      ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log("----------------------------------------------------------");
  console.log(`Body (HTML):\n${options.html}`);
  console.log("==========================================================\n");
};
