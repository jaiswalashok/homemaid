# Enable Firebase Authentication - Complete Guide

## ✅ Step 1: Enable Email/Password Authentication

### Via Firebase Console (Easiest):
1. Go to: https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
2. Click on **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **"Save"**

### Via Firebase CLI:
```bash
# Not directly supported - must use Console
```

---

## ✅ Step 2: Enable Google Authentication

### Via Firebase Console:
1. Go to: https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
2. Click on **"Google"**
3. Toggle **"Enable"** to ON
4. **Project support email:** ashok@jaiswals.live
5. Click **"Save"**

---

## ✅ Step 3: Enable Apple Sign-In (Optional)

### Prerequisites:
- Apple Developer Account
- Bundle ID: `live.jaiswals.homemaid`

### Via Firebase Console:
1. Go to: https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
2. Click on **"Apple"**
3. Toggle **"Enable"** to ON

### Apple Developer Console Setup:

#### A. Create Services ID:
1. Go to: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click **"+"** to create new Services ID
3. **Description:** HomeMaid Web
4. **Identifier:** `live.jaiswals.homemaid.signin` (or similar)
5. Enable **"Sign In with Apple"**
6. Click **"Configure"**
7. Add domains and return URLs:
   - **Domains:** `homemaid-f7a6e.firebaseapp.com`
   - **Return URLs:** `https://homemaid-f7a6e.firebaseapp.com/__/auth/handler`
8. Click **"Save"** and **"Continue"**

#### B. Create Key for Apple Sign-In:
1. Go to: https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create new key
3. **Key Name:** HomeMaid Apple Sign-In Key
4. Enable **"Sign In with Apple"**
5. Click **"Configure"** and select your Primary App ID
6. Click **"Save"** and **"Continue"**
7. Click **"Register"**
8. **Download the .p8 key file** (only available once!)
9. Note the **Key ID** (e.g., `ABC123XYZ`)

#### C. Get Team ID:
1. Go to: https://developer.apple.com/account/#!/membership
2. Copy your **Team ID** (e.g., `XYZ123ABC`)

#### D. Configure in Firebase Console:
1. Back in Firebase Console → Authentication → Apple
2. Enter:
   - **Services ID:** `live.jaiswals.homemaid.signin`
   - **Apple Team ID:** (your Team ID from step C)
   - **Key ID:** (your Key ID from step B)
   - **Private Key:** (paste contents of .p8 file)
3. Click **"Save"**

---

## 🔐 Service Account Setup (For Firebase Admin SDK)

The Firebase Admin SDK needs credentials to work. You have two options:

### Option 1: Use Application Default Credentials (Recommended for Development)

```bash
# Login to Firebase CLI (already done)
firebase login

# This automatically sets up credentials for local development
```

### Option 2: Use Service Account Key (For Production)

1. Go to: https://console.firebase.google.com/project/homemaid-f7a6e/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download the JSON file
4. Add to `.env`:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**For local development, Option 1 is sufficient since you're already logged in via Firebase CLI.**

---

## 🧪 Test Authentication

After enabling the providers, test each method:

### Test Email/Password:
```bash
# Visit http://localhost:3000/login
# Click "Sign up"
# Enter email, password, name
# Click "Send Verification Code"
# Check email for 4-digit code
# Enter code
# Should create account and sign in
```

### Test Google Sign-In:
```bash
# Visit http://localhost:3000/login
# Click "Continue with Google"
# Select Google account
# Should sign in successfully
```

### Test Apple Sign-In:
```bash
# Visit http://localhost:3000/login
# Click "Continue with Apple"
# Sign in with Apple ID
# Should sign in successfully
```

---

## 📋 Verification Checklist

- [ ] Email/Password enabled in Firebase Console
- [ ] Google authentication enabled in Firebase Console
- [ ] Support email added for Google auth
- [ ] Apple Sign-In configured (optional)
- [ ] Firebase Admin SDK working (check server logs)
- [ ] Resend API key configured
- [ ] Test email signup with verification code
- [ ] Test Google Sign-In
- [ ] Test Apple Sign-In (if configured)

---

## 🐛 Troubleshooting

### Error: `auth/operation-not-allowed`
**Solution:** Enable the authentication provider in Firebase Console

### Error: `Failed to send verification email`
**Solution:** 
- Check Resend API key in `.env`
- Verify domain in Resend dashboard
- Check server logs for detailed error

### Error: `Failed to create user account`
**Solution:**
- Check Firebase Admin SDK is initialized
- Verify Firebase CLI is logged in
- Check server logs for detailed error

### Error: `Invalid verification code`
**Solution:**
- Code may have expired (10 minutes)
- Request a new code
- Check Firestore for verification records

### Apple Sign-In Not Working:
**Checklist:**
- [ ] Services ID created in Apple Developer
- [ ] Sign In with Apple enabled for Services ID
- [ ] Domains and return URLs configured
- [ ] Key created and downloaded
- [ ] All credentials entered in Firebase Console
- [ ] OAuth redirect URI matches Firebase

---

## 📞 Support

- **Email:** ashok@jaiswals.live
- **Firebase Project:** homemaid-f7a6e
- **Firebase Console:** https://console.firebase.google.com/project/homemaid-f7a6e

---

**Last Updated:** 2026-02-24  
**Project:** HomeMaid by Jaiswals Family
