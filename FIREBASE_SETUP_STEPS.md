# Firebase Authentication Setup - Quick Steps

## ✅ Step 1: Login to Firebase CLI

Run in terminal:
```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www
firebase login
```

**Select account:** ashok@jaiswals.live

---

## ✅ Step 2: Enable Authentication Methods in Firebase Console

### Option A: Direct Links (Fastest)

1. **Enable Email/Password:**
   - Visit: https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
   - Click "Email/Password" → Toggle ON → Save

2. **Enable Google:**
   - Click "Google" → Toggle ON
   - Support email: ashok@jaiswals.live
   - Save

3. **Enable Apple (Optional):**
   - Click "Apple" → Toggle ON
   - Requires Apple Developer setup (see ENABLE_FIREBASE_AUTH.md)
   - Save

### Option B: Step-by-Step

1. Go to: https://console.firebase.google.com
2. Select project: **homemaid-f7a6e**
3. Click "Authentication" in left sidebar
4. Click "Sign-in method" tab
5. Enable each provider:
   - **Email/Password** → Enable → Save
   - **Google** → Enable → Add support email → Save
   - **Apple** → Enable → Add credentials → Save

---

## ✅ Step 3: Add Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains:

Add these domains:
- `localhost` (already added by default)
- `jaiswals.live`
- `homemaid-f7a6e.web.app` (Firebase hosting)
- `homemaid-f7a6e.firebaseapp.com` (Firebase hosting)

---

## ✅ Step 4: Verify Setup

After enabling authentication methods, test the app:

```bash
# App should already be running at http://localhost:3000
# If not, start it:
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid/www
npm run dev
```

**Test Flow:**
1. Visit http://localhost:3000
2. Should redirect to `/landing`
3. Click "Get Started" or "Log in"
4. Try each authentication method:
   - ✅ Email/Password signup
   - ✅ Google Sign-In
   - ✅ Apple Sign-In (if configured)

---

## 🐛 Expected Errors (Before Enabling Auth)

### Before enabling Email/Password:
```
Firebase: Error (auth/operation-not-allowed)
```

### Before enabling Google:
```
Firebase: Error (auth/operation-not-allowed)
```

### Before enabling Apple:
```
Firebase: Error (auth/operation-not-allowed)
```

**Solution:** Enable the corresponding provider in Firebase Console

---

## 📋 Quick Checklist

- [ ] Logged in to Firebase CLI with ashok@jaiswals.live
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled (with support email)
- [ ] Apple authentication enabled (optional)
- [ ] Authorized domains added
- [ ] Tested email signup
- [ ] Tested Google Sign-In
- [ ] Tested Apple Sign-In (if enabled)

---

## 🔗 Important Links

- **Firebase Console:** https://console.firebase.google.com/project/homemaid-f7a6e
- **Authentication Providers:** https://console.firebase.google.com/project/homemaid-f7a6e/authentication/providers
- **Authorized Domains:** https://console.firebase.google.com/project/homemaid-f7a6e/authentication/settings
- **Users List:** https://console.firebase.google.com/project/homemaid-f7a6e/authentication/users

---

**Project:** HomeMaid (homemaid-f7a6e)  
**Support:** ashok@jaiswals.live
