# Pangram COS 350 Terminal 🖥️🤖

A full-stack web tool for **COS 350 Assignment A4** that allows students to generate AI text, test it with the **Pangram AI detector**, and practice editing it to reduce AI-detection likelihood. The project combines a **React frontend** with a **Firebase Cloud Functions backend** that handles CAS authentication, session management, and usage tracking.

---

## **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Notes](#notes)

---

## **Overview**

The Pangram COS 350 Terminal lets students interact with AI-generated text in a controlled environment:

- Students submit text and get a **Pangram AI detection score**.
- The tool enforces **usage limits per student** (via Firestore).
- Authentication is handled securely via **Princeton CAS**.
- All API requests to Pangram are proxied through the backend to **share a single API subscription**.

---

## **Features**

- **CAS Login/Logout**: Authenticate Princeton users securely.
- **Usage Tracking**: Each user has a max of 5 API calls (configurable).
- **Input/Output Panels**: React UI for submitting text and viewing JSON responses.
- **Loading and Status Indicators**: Shows progress while waiting for API responses.
- **Modal Info Panel**: Instructions and background info for students.

---

## **Architecture**

```
Frontend (React)
│
├─ /src
│   ├─ App.js           # Main React component
│   ├─ JSONColorOutput.js # Renders API responses in color
│   └─ utils/firebase.js # Firebase initialization
│
├─ package.json
└─ .env                 # API base URL & keys

Backend (Firebase Functions / Express)
│
├─ index.js             # Express app with CAS and usage routes
├─ package.json
├─ .env                 # CAS, Firestore, session, API configs
└─ node_modules/
```

- **Frontend** communicates with backend via `REACT_APP_API_BASE_URL`.
- **Backend** handles CAS authentication, Firestore usage, and API proxying.
- **Firebase Emulators** can run both frontend and backend locally for testing.

---

## **Prerequisites**

- Node.js >= 18 (recommended 18–24)
- npm >= 9
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project initialized for Functions and Firestore
- Access to Pangram API key

---

## **Environment Variables**

### Frontend (`.env` in `frontend/`)

```env
# Base URL for backend API
REACT_APP_API_BASE_URL=http://localhost:5001/<project-id>/us-central1/app
REACT_APP_PANGRAM_API_KEY=your-pangram-api-key
REACT_APP_FIREBASE_FIRESTORE_COLLECTION=usage
```

### Backend (`.env` in `functions/`)

```env
CAS_URL=https://fed.princeton.edu/cas/
FIRESTORE_COLLECTION=usage
SESSION_SECRET=your-session-secret
SESSION_NAME=session
CLIENT_URL=http://localhost:3000
MAX_USAGE=5
```

> ⚠️ Keep all `.env` files out of version control.

---

## **Local Development**

### Backend

```bash
cd functions
npm install
firebase emulators:start --only functions
```

- Functions will run at:
  `http://localhost:5001/<project-id>/us-central1/app`

### Frontend

```bash
cd frontend
npm install
npm start
```

- Frontend runs at: `http://localhost:3000`
- Make sure `REACT_APP_API_BASE_URL` points to your local backend.

---

## **Deployment**

### Backend

```bash
cd functions
npm install
firebase deploy --only functions
```

- Backend functions will be live at:
  `https://us-central1-<project-id>.cloudfunctions.net/app`

### Frontend

1. Build production version:

```bash
cd frontend
npm run build
```

2. Deploy to Firebase Hosting (or any static host):

```bash
firebase deploy --only hosting
```

- Frontend will then communicate with deployed backend via production API URL.

---

## **API Reference (Backend)**

| Endpoint               | Method | Description                                         |
| ---------------------- | ------ | --------------------------------------------------- |
| `/api/login`           | GET    | Initiates CAS login or validates CAS ticket         |
| `/api/logout`          | GET    | Logs user out and redirects to CAS logout           |
| `/api/me`              | GET    | Returns signed-in user email                        |
| `/api/usage`           | GET    | Returns user’s current API usage count              |
| `/api/usage/increment` | POST   | Increments usage count (fails if max usage reached) |

---

## **Notes**

- **Sessions**: Managed via cookie-session, encrypted, 12-hour lifetime.
- **Usage Limits**: Enforced both client-side and server-side.
- **CAS Authentication**: Princeton CAS handles secure sign-in.
- **Pangram API**: Requests are proxied through backend to consolidate API quota.
