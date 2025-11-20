# Pangram COS 350 Backend (Firebase Functions)

This folder contains the **backend server** for the Pangram COS 350 assignment tool. It uses **Firebase Cloud Functions** and **Express** to provide API endpoints for:

- CAS authentication
- User session management
- Usage tracking (via Firestore)
- Proxying requests to the Pangram AI detection API

---

## **Table of Contents**

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)

---

## **Prerequisites**

- Node.js >= 18 (recommended 18–24)
- npm >= 9
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project initialized with Functions (`firebase init functions`)

---

## **Environment Variables**

Create a `.env` file in the `functions/` folder. Required variables:

```env
# CAS configuration
CAS_URL=https://fed.princeton.edu/cas/

# Name of the Firestore collection used for tracking usage
FIRESTORE_COLLECTION=usage

# Secret key for session encryption
SESSION_SECRET=your-session-secret
SESSION_NAME=session

# Frontend URL for redirects after login/logout
CLIENT_URL=http://localhost:3000

# Pangram usage limit per user
MAX_USAGE=5
```

> ⚠️ All variables are loaded using `dotenv`. Keep this file out of version control.

---

## **Local Development**

1. Install dependencies:

```bash
cd functions
npm install
```

2. Start the Firebase Functions emulator:

```bash
firebase emulators:start --only functions
```

- Your backend will run at:
  `http://localhost:5001/<project-id>/us-central1/app`
- Example: `http://localhost:5001/pangram-tolu/us-central1/app/api/me`

3. The frontend can use this local URL as the API base (`REACT_APP_API_BASE_URL`) for development.

---

## **Deployment**

Deploy backend functions to Firebase:

```bash
firebase deploy --only functions
```

- Make sure the `.env` variables are properly configured for production.
- After deployment, your functions are available at:
  `https://us-central1-<project-id>.cloudfunctions.net/app`

---

## **Project Structure**

```
functions/
│
├─ index.js                # Main Express server & Firebase Functions entry
├─ package.json            # Dependencies & scripts
├─ .env                    # Environment variables
├─ node_modules/           # Installed dependencies
└─ README.md               # This file
```

---

## **API Endpoints**

| Endpoint               | Method | Description                                         |
| ---------------------- | ------ | --------------------------------------------------- |
| `/api/login`           | GET    | Initiates CAS login or validates CAS ticket         |
| `/api/logout`          | GET    | Logs the user out and redirects to CAS logout       |
| `/api/me`              | GET    | Returns the currently signed-in user's email        |
| `/api/usage`           | GET    | Returns current user's usage count from Firestore   |
| `/api/usage/increment` | POST   | Increments usage count (fails if max usage reached) |

---

### **Notes**

- **Sessions:** Stored in encrypted cookies using `cookie-session`.
- **Usage Tracking:** Firestore is used to track how many times each user has accessed the AI API.
- **CAS Authentication:** Princeton CAS login is used for all user verification.
- **Proxying Pangram API:** The backend is responsible for calling the Pangram API using the API key stored in `.env`.
