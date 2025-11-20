// functions/index.js
require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const session = require("cookie-session");
const axios = require("axios");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();

const app = express();

// Session setup
app.use(
  session({
    name: process.env.SESSION_NAME || "session",
    keys: [process.env.SESSION_SECRET || "super-secret-key"],
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
  })
);

// CAS config from .env
const CAS_URL = process.env.CAS_URL || "https://fed.princeton.edu/cas/";

// Helper: Get current URL for CAS service
function currentUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  return `${protocol}://${req.get("host")}${req.originalUrl}`;
}

// CAS login route
app.get("/api/login", async (req, res) => {
  if (req.session.username) {
    return res.json({ username: req.session.username });
  }

  const ticket = req.query.ticket;
  const serviceUrl = encodeURIComponent(currentUrl(req));

  if (ticket) {
    // Validate CAS ticket
    try {
      const validateUrl = `${CAS_URL}validate?service=${serviceUrl}&ticket=${ticket}`;
      const response = await axios.get(validateUrl);
      const lines = response.data.split("\n");

      if (lines[0] === "yes") {
        const username = lines[1].trim();
        req.session.username = username;
        return res.redirect(process.env.CLIENT_URL || "/"); // redirect to React frontend
      } else {
        return res.redirect(`${CAS_URL}login?service=${serviceUrl}`);
      }
    } catch (err) {
      console.error("CAS validation error:", err);
      return res.status(500).send("CAS validation failed");
    }
  } else {
    // No ticket: redirect to CAS login
    return res.redirect(`${CAS_URL}login?service=${serviceUrl}`);
  }
});

// Logout route
app.get("/api/logout", (req, res) => {
  req.session = null;
  return res.redirect(
    `${CAS_URL}logout?service=${encodeURIComponent(
      process.env.CLIENT_URL || "/"
    )}`
  );
});

// API: Get current user
app.get("/api/me", (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ email: `${req.session.username}@princeton.edu` });
});

// API: Usage tracking
app.get("/api/usage", async (req, res) => {
  if (!req.session.username)
    return res.status(401).json({ error: "Not logged in" });

  const email = `${req.session.username}@princeton.edu`;
  const docRef = doc(db, process.env.FIRESTORE_COLLECTION, email);
  const docSnap = await getDoc(docRef);
  const count = docSnap.exists() ? docSnap.data()?.count || 0 : 0;

  res.json({ email, count });
});

app.post("/api/usage/increment", async (req, res) => {
  if (!req.session.username)
    return res.status(401).json({ error: "Not logged in" });

  const email = `${req.session.username}@princeton.edu`;
  const docRef = doc(db, process.env.FIRESTORE_COLLECTION, email);
  const docSnap = await getDoc(docRef);

  let currentCount = docSnap.exists() ? docSnap.data()?.count || 0 : 0;
  if (currentCount >= Number(process.env.MAX_USAGE || 5)) {
    return res.status(403).json({ error: "Usage limit reached" });
  }

  await setDoc(docRef, { count: currentCount + 1 }, { merge: true });
  res.json({ count: currentCount + 1 });
});

exports.app = functions.https.onRequest(app);
