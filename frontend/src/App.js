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
  const [userEmail, setUserEmail] = useState(null);
  const [usageCount, setUsageCount] = useState(0);

  const API_KEY = process.env.REACT_APP_PANGRAM_API_KEY;
  const FIRESTORE_COLLECTION =
    process.env.REACT_APP_FIREBASE_FIRESTORE_COLLECTION;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // CAS login
  const handleCASLogin = () => {
    window.location.href = `${API_BASE_URL}/api/login`;
  };

  // CAS logout
  const handleCASLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`);
      setUserEmail(null);
      setUsageCount(0);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Fetch usage count from Firestore
  const fetchUsageCount = async (email) => {
    if (!email) return;
    const docRef = doc(db, FIRESTORE_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    setUsageCount(docSnap.exists() ? docSnap.data()?.count || 0 : 0);
  };

  // Increment usage count in Firestore
  const incrementUsage = async (email) => {
    if (!email) return false;
    const docRef = doc(db, FIRESTORE_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    let currentCount = docSnap.exists() ? docSnap.data()?.count || 0 : 0;

    if (currentCount >= 5) {
      alert("You have reached the maximum number of allowed tries.");
      return false;
    }

    await setDoc(docRef, { count: currentCount + 1 }, { merge: true });
    setUsageCount(currentCount + 1);
    return true;
  };

  // Send button handler
  const handleSend = async () => {
    if (!userEmail) return; // Prevent sending if not signed in

    if (usageCount >= 5) {
      alert("You have reached the maximum number of allowed tries.");
      return;
    }

    setLoading(true);
    setResponse(null);
    setProgress(0);

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

      // Increment usage count
      await incrementUsage(userEmail);
    } catch (err) {
      setResponse({ error: err.message });
    }

    clearInterval(interval);
    setProgress(100);
    setTimeout(() => setLoading(false), 400);
  };

  // On mount, fetch user info
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`);
        if (!res.ok) return;
        const data = await res.json();
        setUserEmail(data.email);
        await fetchUsageCount(data.email);
      } catch (err) {
        console.log("User not logged in");
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <span>Pangram COS 350 Terminal</span>
        {userEmail && (
          <>
            <span style={{ marginLeft: "20px" }}>Usage: {usageCount}/5</span>
            <button
              className="info-btn"
              style={{ marginLeft: "10px" }}
              onClick={handleCASLogout}
            >
              Sign Out
            </button>
          </>
        )}
        <button className="info-btn" onClick={() => setShowModal(true)}>
          ?
        </button>
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

      {/* Sign-in overlay if not signed in */}
      {!userEmail && (
        <div className="modal-overlay">
          <div className="loading-modal">
            <h3>Please Sign In</h3>
            <p>You must sign in with your Princeton account to use this app.</p>
            <button className="terminal-btn" onClick={handleCASLogin}>
              Sign In with CAS
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text..."
            disabled={!userEmail}
          />
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
