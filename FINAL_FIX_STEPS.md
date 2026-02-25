# Final Fix: Download Service Account Key

## ✅ Current Status

- ✅ All authentication providers enabled in Firebase Console (Email, Google, Apple)
- ✅ Code updated to use Firebase Admin SDK
- ❌ Firebase Admin SDK needs service account credentials

## 🔑 Solution: Download Service Account Key

### Quick Steps (2 minutes):

1. **Open this link:**
   https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk

2. **Click "Generate new private key"**

3. **Click "Generate key"** in the dialog

4. **Move the downloaded file:**
   ```bash
   mv ~/Downloads/homemaid-f7a6e-firebase-adminsdk-*.json /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www/service-account-key.json
   ```

5. **Add to .gitignore:**
   ```bash
   echo 'service-account-key.json' >> /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www/.gitignore
   ```

6. **Add to .env:**
   ```bash
   cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid
   
   # Option 1: Reference the file path
   echo 'GOOGLE_APPLICATION_CREDENTIALS=./www/service-account-key.json' >> .env
   
   # OR Option 2: Paste the JSON content (recommended for deployment)
   # Open the JSON file, copy its contents, and add to .env:
   # FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```

7. **Restart server:**
   ```bash
   cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www
   pnpm dev
   ```

8. **Test:**
   - Visit http://localhost:3000/login?mode=signup
   - Try email signup
   - Should work now!

---

## 🎯 What This Fixes

The error you're seeing:
```
Unable to detect a Project Id in the current environment
```

Is because Firebase Admin SDK needs proper credentials. The service account key provides:
- Project ID
- Private key for authentication
- Service account email
- All necessary credentials for Firebase Admin SDK

---

## 🔒 Security

- Service account key is added to `.gitignore`
- Never commit this file to GitHub
- For production (Vercel), add `FIREBASE_SERVICE_ACCOUNT` as environment variable with the JSON content

---

## 📞 After This Works

Once email signup works:
1. ✅ Email signup with verification code will work
2. ✅ Google Sign-In already works (client-side)
3. ✅ Apple Sign-In already works (client-side)

---

**Download Link:** https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk
