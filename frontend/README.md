# Pangram COS 350 Frontend

This is the **React frontend** for the Pangram COS 350 assignment tool. It interacts with a **backend API** (hosted on Firebase Functions) for:

- Proxying requests to the Pangram AI detection API
- Tracking per-user usage in Firestore
- Sending email alerts when total usage exceeds thresholds
- Supporting login via **Microsoft (MSAL)** with a whitelist of allowed users

---

## **Table of Contents**

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Microsoft Entra (Azure AD) Setup](#microsoft-entra-azure-ad-setup)
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
- An Azure subscription (or access to Microsoft Entra ID) to register an application for MSAL login

---

## **Environment Variables**

Create a `.env` file in the frontend folder. Required variables:

```env
# Base URL for the backend API (Firebase Functions)
REACT_APP_API_BASE_URL=http://localhost:5001/<project-id>/us-central1/app

# Pangram API key (used by backend proxy)
REACT_APP_PANGRAM_API_KEY=your-pangram-api-key

# Max words allowed in input
REACT_APP_MAX_WORDS=1001

# Max usage per user
REACT_APP_MAX_USAGE=40

# Comma-separated list of allowed NetIDs (whitelist for MSAL login)
REACT_APP_LOGIN_IDS="az1234,xy6741,rk1738"

# Comma-separated list of email addresses to alert
REACT_APP_ALERT_EMAILS="az1234@princeton.edu,xy6741@princeton.edu,rk1738@cs.princeton.edu"

# Alert settings
REACT_APP_ALERT_THRESHOLD=1000
REACT_APP_ALERT_STEP=100

# Firebase configuration for Firestore usage tracking
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_FIREBASE_FIRESTORE_COLLECTION=your_firestore_collection_name

# Azure AD / MSAL configuration (for Microsoft login)
REACT_APP_AZURE_CLIENT_ID=your_azure_app_client_id_here
REACT_APP_AZURE_TENANT_ID=your_tenant_id_or_common_here
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000/  # Local dev; replace with prod URI in production
```

> ⚠️ All React environment variables must start with `REACT_APP_`. Do not commit `.env` with secrets to version control.

---

## **Microsoft Entra (Azure AD) Setup**

To enable login via Microsoft accounts using **MSAL**, you need to register your application in Azure:

### 1. Register a new app

1. Go to [Azure Portal → Entra ID → App registrations → New registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Give your app a name (e.g., `Pangram-Frontend`)
3. Supported account types:

   - **Single tenant** (your organization) or
   - **Multitenant** (`common`) if needed

4. Click **Register**

---

### 2. Configure Redirect URI for SPA

1. Go to **Authentication** in your app registration
2. Under **Redirect URIs → Add a platform**, select **Single-page application (SPA)**
3. Enter the redirect URI:

```
http://localhost:3000/
```

> For production, add your hosted URL as a separate SPA redirect URI.

4. Enable **Authorization code flow with PKCE** under SPA settings
5. Ensure the application is marked as a **public client**

---

### 3. Copy values to `.env`

- **Client ID** → `REACT_APP_AZURE_CLIENT_ID`
- **Tenant ID** → `REACT_APP_AZURE_TENANT_ID` (`common` for multi-tenant)
- **Redirect URI** → `REACT_APP_AZURE_REDIRECT_URI`

---

### 4. MSAL behavior in React

- Users must authenticate via Microsoft login popup
- Only emails in `REACT_APP_LOGIN_IDS` are allowed to use the app
- MSAL provides `idToken` and `accessToken` in the client for API calls
- You can log responses for debugging:

```js
instance
  .loginPopup(loginRequest)
  .then((response) => console.log("MSAL login response:", response))
  .catch((error) => console.error("Login error:", error));
```

---

## **Local Development**

1. Install dependencies:

```bash
npm install
```

2. Start the React development server:

```bash
npm start
```

- Your app will run at `http://localhost:3000`.
- All `/api` requests are forwarded to the backend using `REACT_APP_API_BASE_URL`.

---

## **Building for Production**

Generate a production-ready build:

```bash
npm run build
```

- Creates a `build/` folder with optimized static files.
- Make sure `REACT_APP_API_BASE_URL` points to your **deployed backend**.
- Add your production redirect URI to Azure SPA redirect URIs.

---

## **Deployment**

Deploy to Firebase Hosting:

```bash
firebase deploy --only hosting
```

- Ensure `firebase.json` has `build` as the public directory.
- After deployment, your site will be available at the Firebase Hosting URL (e.g., `https://pangram-tolu.web.app`).

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
│   └─ index.js             # App entry point, wrapped with MsalProvider
├─ .env                     # Environment variables
├─ package.json             # Project metadata & scripts
└─ README.md                # This file
```

---

## **Usage**

1. **Sign in**

   - Click **Sign In with Microsoft** (MSAL) and authenticate with your institutional account.
   - Only users in `REACT_APP_LOGIN_IDS` are allowed to use the app.
   - You can log MSAL responses for debugging by adding `console.log(response)` inside `loginPopup().then(...)`.

2. **Input text**

   - Enter text in the **Input panel**.
   - Maximum words are enforced via `REACT_APP_MAX_WORDS`.

3. **Send request**

   - Click **Send** to submit text to the Pangram API via the backend.
   - The backend tracks usage in Firestore per user.

4. **Usage limits and alerts**

   - Each user is limited by `REACT_APP_MAX_USAGE`.
   - If total cumulative usage exceeds `REACT_APP_ALERT_THRESHOLD`, the frontend calls the backend `/api/send-alert` endpoint to notify addresses in `REACT_APP_ALERT_EMAILS`.

5. **View output**

   - Responses from Pangram are displayed in the **Output panel** using `JSONColorOutput`.
   - Color-coded JSON highlights results for easier inspection.

6. **Help modal**

   - Click the **ⓘ** button in the header to view instructions and information about Pangram.
