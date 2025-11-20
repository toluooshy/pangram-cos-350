# Pangram COS 350 Frontend

This is the **React frontend** for the Pangram COS 350 assignment tool. It interacts with a backend API (hosted on Firebase Functions) for user authentication, AI text processing, and usage tracking.

---

## **Table of Contents**

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Usage](#usage)

---

## **Prerequisites**

- Node.js >= 18 (recommended 18–24)
- npm >= 9
- Firebase CLI (`npm install -g firebase-tools`)

---

## **Environment Variables**

Create a `.env` file in the frontend folder. Required variables:

```env
# Base URL for the backend API (Firebase Functions)
# During local development, you can rely on the proxy
REACT_APP_API_BASE_URL=http://localhost:5001/pangram-tolu/us-central1/app

# Pangram API key (provided by the instructor)
REACT_APP_PANGRAM_API_KEY=your-pangram-api-key

# Firestore collection used for tracking usage
REACT_APP_FIREBASE_FIRESTORE_COLLECTION=usage
```

> ⚠️ Remember: All React environment variables must start with `REACT_APP_`.

---

## **Local Development**

1. Install dependencies:

```bash
npm install
```

2. Start the React development server (with proxy to local Firebase Functions):

```bash
npm start
```

- Your app will run at `http://localhost:3000`.
- The React development server will forward `/api` requests to the backend via the proxy defined in `package.json`.

---

## **Building for Production**

Generate a production-ready build:

```bash
npm run build
```

- This creates a `build/` folder with optimized static files.
- Environment variables will be bundled at build time.

---

## **Deployment**

Deploy the frontend to Firebase Hosting:

```bash
firebase deploy --only hosting
```

- Make sure `firebase.json` has `build` as the public directory.
- After deployment, your site will be available at the Firebase Hosting URL (e.g., `https://pangram-tolu.web.app`).

> **Note:** Update `REACT_APP_API_BASE_URL` to point to your **deployed backend** in production.

---

## **Project Structure**

```
frontend/
│
├─ public/                  # Static assets
├─ src/
│   ├─ App.css              # Styling
│   ├─ App.js               # Main React component
│   ├─ JSONColorOutput.js   # Component to render API responses
│   ├─ utils/
│   │   └─ firebase.js      # Firestore config
│   └─ index.js             # App entry point
├─ .env                     # Environment variables
├─ package.json             # Project metadata & scripts
└─ README.md                # This file
```

---

## **Usage**

- Input text into the terminal panel and click **Send**.
- If not logged in, the app will prompt for CAS login.
- Each user is limited to a set number of requests (configurable via Firestore and `MAX_USAGE`).
- View API responses in the output panel with color-coded JSON.
- Use the **?** button in the header to see instructions.
