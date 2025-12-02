// functions/index.js
require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");

admin.initializeApp();

const app = express();

// Session setup
app.use(cors({ origin: true }));

// Helper: Send email alert using Nodemailer
async function sendEmailAlert(to, subject, message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not set in .env");
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // your Google App Password
    },
  });

  // Send email
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to.join(","), // array of recipients
    subject,
    text: message,
  });

  console.log("Email sent:", info.response);
  return info;
}

// API: Send usage alerts
app.post("/api/send-alert", async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Missing to, subject, or message" });
  }

  try {
    await sendEmailAlert(to, subject, message);
    res.json({ success: true, message: `Alert sent to ${to.join(", ")}` });
  } catch (err) {
    console.error("Failed to send alert:", err);
    res.status(500).json({ error: "Failed to send alert" });
  }
});

exports.app = functions.https.onRequest(app);
