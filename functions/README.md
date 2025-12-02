# Pangram COS 350 Backend (Firebase Functions)

This folder contains the **backend server** for the Pangram COS 350 assignment tool. It uses **Firebase Cloud Functions** and **Express** to provide API endpoints for:

- Sending email alerts via Nodemailer
- CORS-enabled API access for frontend or other services

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
# Email settings for Nodemailer
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS="your app password"
```

> ⚠️ All variables are loaded using `dotenv`. Keep this file secret! Do **not** commit it to version control. Use `.gitignore`.

---

### **How to Generate an App Password**

Some email providers (Gmail, Outlook, Yahoo) require an **App Password** to allow third-party apps to send email via SMTP.

---

### ✅ **1. Gmail**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already on.
3. Under **Signing in to Google**, click **App Passwords**.
4. Select:

   - App: Mail
   - Device: Other → name it (e.g., “Node.js Server”)

5. Google generates a **16-character app password**.
6. Use this **exact string** (without spaces) as `EMAIL_PASS` in your `.env`.

**Tip:** If you copy it with spaces (like `"abcd efgh ijkl mnop"`), remove the spaces so it becomes `"abcdefghijklmnop"`.

---

### ✅ **2. Outlook / Hotmail**

1. Sign in at [Microsoft Account Security](https://account.microsoft.com/security).
2. Enable **Two-Step Verification**.
3. Go to **Advanced Security Options → App passwords → Create a new app password**.
4. Copy the password and use it as `EMAIL_PASS` in `.env`.

---

### ✅ **3. Yahoo Mail**

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security).
2. Enable **Two-step verification**.
3. Click **Generate app password** → select **Other App** → name it (e.g., “Node.js Server”).
4. Copy the generated password and use it as `EMAIL_PASS` in `.env`.

---

### **Example `.env`**

```env
EMAIL_SERVICE=gmail
EMAIL_USER=myemail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

> Make sure you remove any quotation marks or spaces from the app password.

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
- Example: `http://localhost:5001/pangram-tolu/us-central1/app/api/send-alert`

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

| Endpoint          | Method | Description                           |
| ----------------- | ------ | ------------------------------------- |
| `/api/send-alert` | POST   | Sends an email alert using Nodemailer |

**Request body (JSON):**

```json
{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "Alert Subject",
  "message": "Alert message body"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Alert sent to recipient1@example.com, recipient2@example.com"
}
```

> Returns `400` if required fields are missing and `500` if sending the email fails.

---

### **Notes**

- **CORS Enabled:** The backend allows requests from any origin.
- **Email Alerts:** Uses Gmail (or any SMTP-compatible service) via Nodemailer.
- **Security:** Keep `.env` secret; never commit your email credentials to version control.
