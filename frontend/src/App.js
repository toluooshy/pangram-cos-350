import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./utils/firebase";
import { loginRequest } from "./utils/auth";
import JSONColorOutput from "./JSONColorOutput";
import { useMsal } from "@azure/msal-react";
import "./App.css";

export default function App() {
  const { instance } = useMsal();

  const [text, setText] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const [usageCount, setUsageCount] = useState(0);

  const API_KEY = process.env.REACT_APP_PANGRAM_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const FIRESTORE_COLLECTION =
    process.env.REACT_APP_FIREBASE_FIRESTORE_COLLECTION;
  const MAX_WORDS = process.env.REACT_APP_MAX_WORDS;
  const MAX_USAGE = process.env.REACT_APP_MAX_USAGE;
  const LOGIN_IDS = (process.env.REACT_APP_LOGIN_IDS || "").split(",");
  const ALERT_EMAILS = (process.env.REACT_APP_ALERT_EMAILS || "").split(",");
  const ALERT_THRESHOLD = Number(process.env.REACT_APP_ALERT_THRESHOLD || 1000);
  const ALERT_STEP = Number(process.env.REACT_APP_ALERT_STEP || 100);

  // MSAL-powered Login
  const handleLogin = () => {
    instance
      .loginPopup(loginRequest)
      .then((response) => {
        // Get the whitelist from .env and split into array
        const whitelist = LOGIN_IDS;
        const email = response.account.username;
        const trimmedNetid = email.split("@")[0];

        if (!whitelist.includes(trimmedNetid)) {
          return alert("This NetID is not allowed.");
        }
        localStorage.setItem("pangram_email", email);
        setUserEmail(email);
        fetchUsageCount(email);
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("pangram_email");
    setUserEmail(null);
    setUsageCount(0);
    window.location.reload();
  };

  // Firestore usage count
  const fetchUsageCount = async (email) => {
    if (!email) return;
    const docRef = doc(db, FIRESTORE_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    setUsageCount(docSnap.exists() ? docSnap.data()?.count || 0 : 0);
  };

  // Cumulative firestore usage count
  const getTotalUsage = async () => {
    const querySnapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    let total = 0;
    querySnapshot.forEach((doc) => {
      const count = doc.data()?.count || 0;
      total += count;
    });
    return total;
  };

  const incrementUsage = async (email) => {
    if (!email) return false;

    const userRef = doc(db, FIRESTORE_COLLECTION, email);
    const userSnap = await getDoc(userRef);
    const currentUserCount = userSnap.exists()
      ? userSnap.data()?.count || 0
      : 0;

    if (currentUserCount >= MAX_USAGE) {
      alert("You have reached the maximum number of allowed tries.");
      return false;
    }

    // Increment user count
    await setDoc(userRef, { count: currentUserCount + 1 }, { merge: true });
    setUsageCount(currentUserCount + 1);

    // Get total usage across all users
    const totalUsage = await getTotalUsage();

    // Send alert if over threshold
    if (
      totalUsage >= ALERT_THRESHOLD &&
      (totalUsage - ALERT_THRESHOLD) % ALERT_STEP === 0
    ) {
      ALERT_EMAILS.forEach(async (email) => {
        await fetch(`${API_BASE_URL}/api/send-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: [email],
            subject: `⚠️ Princeton COS 350 Pangram Terminal Usage: ${totalUsage}`,
            message: `Alert! Total Pangram Terminal AI interface usage across all students for the assignment has reached ${totalUsage} uses.`,
          }),
        });
      });
    }

    return true;
  };

  // Send button handler
  const handleSend = async () => {
    if (!userEmail) return;

    if (usageCount >= MAX_USAGE) {
      alert("You have reached the maximum number of allowed tries.");
      return;
    }

    setLoading(true);
    setResponse(null);
    setProgress(0);

    // Loading bar
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 8 + 3;
      });
    }, 120);

    try {
      const res = await fetch("https://text.api.pangram.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      setResponse(data);

      await incrementUsage(userEmail);
    } catch (err) {
      setResponse({ error: err.message });
    }

    clearInterval(interval);
    setProgress(100);
    setTimeout(() => setLoading(false), 400);
  };

  // Load stored login on mount
  useEffect(() => {
    const stored = localStorage.getItem("pangram_email");
    if (stored) {
      setUserEmail(stored);
      fetchUsageCount(stored);
    }
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <span>Pangram COS 350 Terminal</span>
        <div style={{ display: "flex", alignContent: "center" }}>
          {userEmail && (
            <div style={{ display: "flex" }}>
              <div style={{ fontWeight: 400 }}>
                [Usage: {usageCount}/{MAX_USAGE}]
              </div>
              <button className="terminal-btn2" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
          <button className="info-btn" onClick={() => setShowModal(true)}>
            ⓘ
          </button>
        </div>
      </header>

      {/* About modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>About This Tool</h2>
            <p>
              For Assignment A4, students generate text using AI, then attempt
              to edit it so that Pangram no longer detects it as AI-generated.
            </p>
            <p>
              Pangram is considered one of the strongest AI detectors. The
              company asserts that paraphrasing high-likelihood AI text is
              difficult and may not be easier than writing it yourself.
            </p>
            <p>
              Because Pangram requires a subscription, the instructor proxies
              requests and divides the quota among students.
            </p>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Loading modal */}
      {loading && (
        <div className="modal-overlay">
          <div className="loading-modal">
            <h3>Processing Request...</h3>
            <div className="loading-bar-outline">
              <div
                className="loading-bar-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p>{Math.floor(progress)}%</p>
          </div>
        </div>
      )}

      {/* Login overlay */}
      {!userEmail && (
        <div className="modal-overlay">
          <div className="loading-modal">
            <h3>Sign In</h3>
            <p>
              You must sign in with your institutional account to use this app.
            </p>

            <button className="terminal-btn" onClick={handleLogin}>
              Sign In with Entra ID
            </button>
          </div>
        </div>
      )}

      {/* Main terminal */}
      <div className="terminal-body">
        <div className="terminal-panel">
          <h2 className="panel-title">Input</h2>
          <textarea
            className="terminal-textarea"
            value={text}
            onChange={(e) => {
              const rawWords = e.target.value.split(/\s+/); // keep empty strings
              const words = rawWords.slice(0, MAX_WORDS); // enforce max
              setText(words.join(" "));
            }}
            onPaste={(e) => {
              e.preventDefault();
              const paste = (e.clipboardData || window.clipboardData).getData(
                "text"
              );
              const pasteWords = paste.split(/\s+/); // keep spaces
              const currentWords = text.split(/\s+/);
              const remaining = MAX_WORDS - currentWords.length;
              if (remaining <= 0) return;
              const allowedWords = pasteWords.slice(0, remaining);
              setText([...currentWords, ...allowedWords].join(" "));
            }}
            placeholder="Enter text..."
            disabled={!userEmail}
          />

          {/* Word counter */}
          <div
            style={{
              textAlign: "right",
              fontWeight: "bold",
              color:
                text.split(/\s+/).filter(Boolean).length >= MAX_WORDS - 1
                  ? "#ff0000"
                  : "#ffffff",
              marginTop: "4px",
            }}
          >
            {text.split(/\s+/).filter(Boolean).length} / {MAX_WORDS - 1} words
          </div>
          <button
            className="terminal-btn"
            onClick={handleSend}
            disabled={!userEmail || loading}
          >
            {loading ? "Working..." : "Send"}
          </button>
        </div>

        <div className="terminal-panel">
          <h2 className="panel-title">Output</h2>
          <JSONColorOutput data={response} />
        </div>
      </div>
    </div>
  );
}
