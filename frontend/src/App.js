import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./utils/firebase";
import JSONColorOutput from "./JSONColorOutput";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(0);

  // replaces CAS login
  const [netidInput, setNetidInput] = useState("");
  const [userEmail, setUserEmail] = useState(null);

  const [usageCount, setUsageCount] = useState(0);

  const API_KEY = process.env.REACT_APP_PANGRAM_API_KEY;
  const FIRESTORE_COLLECTION =
    process.env.REACT_APP_FIREBASE_FIRESTORE_COLLECTION;
  const MAX_WORDS = process.env.REACT_APP_MAX_WORDS;
  const MAX_USAGE = process.env.REACT_APP_MAX_USAGE;

  // Login (local only)
  const handleLocalLogin = () => {
    const trimmedNetid = netidInput.trim();
    if (!trimmedNetid) return alert("Please enter a valid NetID.");

    // Get the whitelist from .env and split into array
    const whitelist = (process.env.REACT_APP_LOGIN_IDS || "").split(",");

    if (!whitelist.includes(trimmedNetid)) {
      return alert("This NetID is not allowed.");
    }

    const email = `${trimmedNetid}@princeton.edu`;
    localStorage.setItem("pangram_netid", email);
    setUserEmail(email);
  };

  const handleLocalLogout = () => {
    localStorage.removeItem("pangram_netid");
    setUserEmail(null);
    setUsageCount(0);
  };

  // Firestore usage count
  const fetchUsageCount = async (email) => {
    if (!email) return;
    const docRef = doc(db, FIRESTORE_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    setUsageCount(docSnap.exists() ? docSnap.data()?.count || 0 : 0);
  };

  const incrementUsage = async (email) => {
    if (!email) return false;
    const docRef = doc(db, FIRESTORE_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    const currentCount = docSnap.exists() ? docSnap.data()?.count || 0 : 0;

    if (currentCount >= MAX_USAGE) {
      alert("You have reached the maximum number of allowed tries.");
      return false;
    }

    await setDoc(docRef, { count: currentCount + 1 }, { merge: true });
    setUsageCount(currentCount + 1);
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

    // fake loading bar
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
    const stored = localStorage.getItem("pangram_netid");
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
              <button className="terminal-btn2" onClick={handleLocalLogout}>
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

      {/* Sign-in overlay */}
      {!userEmail && (
        <div className="modal-overlay">
          <div className="loading-modal">
            <h3>Enter NetID</h3>
            <p>You must sign in with your Princeton NetID to use this app.</p>

            <input
              className="terminal-textarea"
              style={{ width: "80%", marginBottom: "10px" }}
              placeholder="NetID (e.g., az1234)"
              value={netidInput}
              onChange={(e) => setNetidInput(e.target.value)}
            />

            <button className="terminal-btn" onClick={handleLocalLogin}>
              Sign In
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
